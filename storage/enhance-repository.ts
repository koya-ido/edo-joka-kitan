import {
  ENHANCE_STAT_CONFIG_MAP,
  WEAPON_MASTER_MAP,
  type EnhanceStatKey,
} from "@/data";
import { applyEnhanceStat } from "@/domain/enhance";
import { applyWeaponRefine } from "@/domain/enhance-weapon";
import { err, ok } from "@/domain/result";
import { validateAndMigrateSave } from "@/domain/save-validator";
import { openPlayerDb } from "@/storage/player-db";
import {
  SAVE_RECORD_KEY,
  type DomainResult,
  type PlayerSaveData,
  type WeaponId,
} from "@/types";

/**
 * 社（強化）の永続ステータス強化を単一 readwrite トランザクションで実行・保存する。
 * 未存在・破損データ時は SAVE_CORRUPTED（401相当）、
 * 最大レベル到達・勾玉不足時は ALREADY_MAX_LEVEL / INSUFFICIENT_MAGATAMA（403相当）で拒否する。
 */
export const enhancePermanentStat = async (
  statKey: EnhanceStatKey,
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
          "セーブデータが見つからないため永続強化を実行できません。",
        );
      }

      const validated = validateAndMigrateSave(rawSave);
      if (!validated.ok) {
        await tx.done;
        return validated;
      }

      const applied = applyEnhanceStat(
        validated.data,
        statKey,
        ENHANCE_STAT_CONFIG_MAP,
        now,
      );
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
    console.error("[storage/enhance-repository] enhancePermanentStat failed", {
      cause,
    });
    return err("STORAGE_ERROR", "永続強化の保存に失敗しました。");
  }
};

/**
 * 社（強化）の武器精錬強化を単一 readwrite トランザクションで実行・保存する。
 * 未存在・破損データ時は SAVE_CORRUPTED（401相当）、
 * 未所持・最大精錬到達・勾玉不足時は UNOWNED_WEAPON / ALREADY_MAX_LEVEL / INSUFFICIENT_MAGATAMA（403相当）で拒否する。
 */
export const enhanceWeaponRefine = async (
  weaponId: WeaponId,
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
          "セーブデータが見つからないため武器精錬を実行できません。",
        );
      }

      const validated = validateAndMigrateSave(rawSave);
      if (!validated.ok) {
        await tx.done;
        return validated;
      }

      const applied = applyWeaponRefine(
        validated.data,
        weaponId,
        WEAPON_MASTER_MAP,
        now,
      );
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
    console.error("[storage/enhance-repository] enhanceWeaponRefine failed", {
      cause,
    });
    return err("STORAGE_ERROR", "武器精錬の保存に失敗しました。");
  }
};
