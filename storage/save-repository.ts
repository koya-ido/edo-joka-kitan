import { err, ok } from "@/domain/result";
import { createInitialPlayerSave } from "@/domain/save-factory";
import { validateAndMigrateSave } from "@/domain/save-validator";
import { openPlayerDb } from "@/storage/player-db";
import {
  SAVE_RECORD_KEY,
  type DomainResult,
  type PlayerSaveData,
} from "@/types";

export interface LoadedSessionSave {
  readonly save: PlayerSaveData;
  readonly isInitial: boolean;
}

const logStorageFailure = (operation: string, cause: unknown): void => {
  console.error(`[storage/save-repository] ${operation} failed`, { cause });
};

/**
 * セーブデータを単一 readwrite トランザクション内で読込または初期生成する。
 * 破損データ検出時は上書きせず SAVE_CORRUPTED を返却する。
 */
export const loadOrInitializeSave = async (
  now: Date = new Date(),
): Promise<DomainResult<LoadedSessionSave>> => {
  try {
    const db = await openPlayerDb();
    const tx = db.transaction("playerSave", "readwrite");
    const store = tx.objectStore("playerSave");
    const existing = await store.get(SAVE_RECORD_KEY);

    if (existing === undefined) {
      const initialSave = createInitialPlayerSave(now);
      await store.put(initialSave, SAVE_RECORD_KEY);
      await tx.done;
      db.close();
      return ok({ save: initialSave, isInitial: true });
    }

    await tx.done;
    db.close();

    const validated = validateAndMigrateSave(existing);
    if (!validated.ok) {
      return validated;
    }
    return ok({ save: validated.data, isInitial: false });
  } catch (cause: unknown) {
    logStorageFailure("loadOrInitializeSave", cause);
    return err("STORAGE_ERROR", "セーブデータの読み込みに失敗しました。");
  }
};

/**
 * セーブデータを初期状態へリセット（上書き保存）する。
 * 呼び出し前に必ずユーザーの確認モーダル承認を経ること。
 */
export const resetPlayerSaveToInitial = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  try {
    const db = await openPlayerDb();
    const tx = db.transaction("playerSave", "readwrite");
    const store = tx.objectStore("playerSave");
    const initialSave = createInitialPlayerSave(now);
    await store.put(initialSave, SAVE_RECORD_KEY);
    await tx.done;
    db.close();
    return ok(initialSave);
  } catch (cause: unknown) {
    logStorageFailure("resetPlayerSaveToInitial", cause);
    return err("STORAGE_ERROR", "セーブデータの初期化に失敗しました。");
  }
};
