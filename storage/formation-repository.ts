import {
  applyFormationChange,
  type FormationSelectionInput,
} from "@/domain/formation";
import { err, ok } from "@/domain/result";
import { validateAndMigrateSave } from "@/domain/save-validator";
import { openPlayerDb } from "@/storage/player-db";
import {
  SAVE_RECORD_KEY,
  type DomainResult,
  type PlayerSaveData,
} from "@/types";

/**
 * 編成変更（主人公1名・持ち込み武器1枠）を単一 readwrite トランザクションで検証・保存する。
 * 未存在・破損データ時は SAVE_CORRUPTED（401相当）、
 * 未所持キャラ/武器・空武器指定時は UNOWNED_CHARACTER / UNOWNED_WEAPON / EMPTY_WEAPON_SELECTION（403相当）で拒否し、状態を変更しない。
 */
export const updateFormation = async (
  selection: FormationSelectionInput,
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
          "セーブデータが見つからないため編成を保存できません。",
        );
      }

      const validated = validateAndMigrateSave(rawSave);
      if (!validated.ok) {
        await tx.done;
        return validated;
      }

      const updated = applyFormationChange(validated.data, selection, now);
      if (!updated.ok) {
        await tx.done;
        return updated;
      }

      await store.put(updated.data, SAVE_RECORD_KEY);
      await tx.done;
      return ok(updated.data);
    } finally {
      db.close();
    }
  } catch (cause: unknown) {
    console.error("[storage/formation-repository] updateFormation failed", {
      cause,
    });
    return err("STORAGE_ERROR", "編成の保存に失敗しました。");
  }
};
