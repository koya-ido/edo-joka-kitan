import { err, ok } from "@/domain/result";
import { createInitialPlayerSave } from "@/domain/save-factory";
import { validatePlayerSaveData } from "@/domain/save-validator";
import { openPlayerDb } from "@/storage/player-db";
import {
  SAVE_RECORD_KEY,
  type DomainResult,
  type PlayerSaveData,
} from "@/types";

/** テスト・動作確認用に初期シードデータを IndexedDB へ投入する */
export const seedInitialPlayerSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const initialSave = createInitialPlayerSave(now);
  return seedPlayerSave(initialSave);
};

/** テスト・動作確認用に任意の検証済みセーブデータを IndexedDB へ投入する */
export const seedPlayerSave = async (
  save: PlayerSaveData,
): Promise<DomainResult<PlayerSaveData>> => {
  const validated = validatePlayerSaveData(save);
  if (!validated.ok) {
    return validated;
  }
  try {
    const db = await openPlayerDb();
    const tx = db.transaction("playerSave", "readwrite");
    await tx.objectStore("playerSave").put(validated.data, SAVE_RECORD_KEY);
    await tx.done;
    db.close();
    return ok(validated.data);
  } catch (cause: unknown) {
    console.error("[storage/seed] seedPlayerSave failed", { cause });
    return err("STORAGE_ERROR", "シードデータの投入に失敗しました。");
  }
};
