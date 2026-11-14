import { STAGE_MASTER_MAP, STAGE_MASTERS } from "@/data";
import {
  applyBattleRerollCost,
  applyBattleResultToSave,
  DEFAULT_BATTLE_REROLL_COST,
  type AppliedBattleResult,
  type CommitBattleResultInput,
} from "@/domain/battle-reward";
import { err, ok } from "@/domain/result";
import { validateAndMigrateSave } from "@/domain/save-validator";
import { openPlayerDb } from "@/storage/player-db";
import {
  SAVE_RECORD_KEY,
  type DomainResult,
  type PlayerSaveData,
} from "@/types";

/**
 * バトル中の3択再抽選（リロール）の勾玉消費を単一 readwrite トランザクションで実行・保存する。
 * 未存在・破損データ時は SAVE_CORRUPTED（401相当）、
 * 勾玉不足時は INSUFFICIENT_MAGATAMA（403相当）で拒否する。
 */
export const rerollBattleChoices = async (
  costMagatama: number = DEFAULT_BATTLE_REROLL_COST,
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  try {
    const db = await openPlayerDb();
    try {
      const tx = db.transaction("playerSave", "readwrite");
      const store = tx.objectStore("playerSave");
      const rawSave = await store.get(SAVE_RECORD_KEY);

      if (rawSave === undefined) {
        await tx.done;
        return err(
          "SAVE_CORRUPTED",
          "セーブデータが見つからないため再抽選を実行できません。",
        );
      }

      const validated = validateAndMigrateSave(rawSave);
      if (!validated.ok) {
        await tx.done;
        return validated;
      }

      const applied = applyBattleRerollCost(validated.data, costMagatama, now);
      if (!applied.ok) {
        await tx.done;
        return applied;
      }

      await store.put(applied.data, SAVE_RECORD_KEY);
      await tx.done;
      return ok(applied.data);
    } finally {
      db.close();
    }
  } catch (cause: unknown) {
    console.error("[storage/battle-repository] rerollBattleChoices failed", {
      cause,
    });
    return err("STORAGE_ERROR", "再抽選の保存に失敗しました。");
  }
};

/**
 * バトル勝敗リザルトの報酬付与・クリア記録・次節解放を単一 readwrite トランザクションで保存する。
 * 未存在・破損データ時は SAVE_CORRUPTED（401相当）、
 * 未解放・不正ステージ時は STAGE_LOCKED / INVALID_STAGE_ID（403相当）で拒否する。
 */
export const commitBattleResult = async (
  input: CommitBattleResultInput,
  now: Date = new Date(),
): Promise<DomainResult<AppliedBattleResult>> => {
  try {
    const db = await openPlayerDb();
    try {
      const tx = db.transaction("playerSave", "readwrite");
      const store = tx.objectStore("playerSave");
      const rawSave = await store.get(SAVE_RECORD_KEY);

      if (rawSave === undefined) {
        await tx.done;
        return err(
          "SAVE_CORRUPTED",
          "セーブデータが見つからないためバトル結果を保存できません。",
        );
      }

      const validated = validateAndMigrateSave(rawSave);
      if (!validated.ok) {
        await tx.done;
        return validated;
      }

      const applied = applyBattleResultToSave(
        validated.data,
        input,
        STAGE_MASTER_MAP,
        STAGE_MASTERS,
        now,
      );
      if (!applied.ok) {
        await tx.done;
        return applied;
      }

      await store.put(applied.data.save, SAVE_RECORD_KEY);
      await tx.done;
      return ok(applied.data);
    } finally {
      db.close();
    }
  } catch (cause: unknown) {
    console.error("[storage/battle-repository] commitBattleResult failed", {
      cause,
    });
    return err("STORAGE_ERROR", "バトル結果の保存に失敗しました。");
  }
};
