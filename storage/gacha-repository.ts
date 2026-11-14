import { GACHA_CONFIG } from "@/data";
import {
  resolveGachaPulls,
  type GachaExecutionOutput,
  type GachaPullCount,
} from "@/domain/gacha";
import { err, ok } from "@/domain/result";
import { validateAndMigrateSave } from "@/domain/save-validator";
import { openPlayerDb } from "@/storage/player-db";
import {
  SAVE_RECORD_KEY,
  type DomainResult,
  type GachaPoolType,
} from "@/types";

/**
 * キャラ／武器ガチャ召喚を単一 readwrite トランザクションで実行・保存する。
 * 未存在・破損データ時は SAVE_CORRUPTED（401相当）、
 * 翡翠不足時は INSUFFICIENT_HISUI（403相当）で拒否し、状態を変更しない。
 */
export const executeGachaPull = async (
  poolType: GachaPoolType,
  count: GachaPullCount,
  rng: () => number = Math.random,
  now: Date = new Date(),
): Promise<DomainResult<GachaExecutionOutput>> => {
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
          "セーブデータが見つからないため召喚を実行できません。",
        );
      }

      const validated = validateAndMigrateSave(rawSave);
      if (!validated.ok) {
        await tx.done;
        return validated;
      }

      const resolved = resolveGachaPulls(
        validated.data,
        poolType,
        count,
        rng,
        now,
        GACHA_CONFIG,
      );
      if (!resolved.ok) {
        await tx.done;
        return resolved;
      }

      await store.put(resolved.data.nextSave, SAVE_RECORD_KEY);
      await tx.done;
      return ok(resolved.data);
    } finally {
      db.close();
    }
  } catch (cause: unknown) {
    console.error("[storage/gacha-repository] executeGachaPull failed", {
      cause,
    });
    return err("STORAGE_ERROR", "召喚結果の保存に失敗しました。");
  }
};
