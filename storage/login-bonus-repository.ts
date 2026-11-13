import { LOGIN_BONUS_CONFIG } from "@/data";
import { applyLoginBonus, getLocalDateKey } from "@/domain/login-bonus";
import { err, ok } from "@/domain/result";
import { validateAndMigrateSave } from "@/domain/save-validator";
import { openPlayerDb } from "@/storage/player-db";
import {
  SAVE_RECORD_KEY,
  type DomainResult,
  type PlayerSaveData,
} from "@/types";

/**
 * 当日 0:00 境界ログインボーナスを受け取り、単一 readwrite トランザクションで永続化する。
 * 未存在・破損データ時は SAVE_CORRUPTED（401相当）、同日二重受取時は LOGIN_BONUS_ALREADY_CLAIMED（403相当）で拒否する。
 */
export const claimLoginBonus = async (
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
          "セーブデータが見つからないためログインボーナスを受け取れません。",
        );
      }

      const validated = validateAndMigrateSave(rawSave);
      if (!validated.ok) {
        await tx.done;
        return validated;
      }

      const todayKey = getLocalDateKey(now);
      const applied = applyLoginBonus(
        validated.data,
        todayKey,
        LOGIN_BONUS_CONFIG,
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
    console.error("[storage/login-bonus-repository] claimLoginBonus failed", {
      cause,
    });
    return err(
      "STORAGE_ERROR",
      "ログインボーナスの受け取り保存に失敗しました。",
    );
  }
};
