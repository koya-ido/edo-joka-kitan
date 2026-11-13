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

/** Slice 1 テスト・動作確認用: 前日分受取済み（当日未受取）セーブを投入する */
export const seedUnclaimedLoginBonusSave = async (
  previousDateKey: string,
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave({
    ...base,
    lastLoginBonusDate: previousDateKey,
  });
};

/** Slice 1 テスト・動作確認用: 当日分受取済みセーブを投入する */
export const seedClaimedLoginBonusSave = async (
  todayDateKey: string,
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave({
    ...base,
    currencies: {
      magatama: base.currencies.magatama + 50,
      hisui: base.currencies.hisui + 5,
    },
    lastLoginBonusDate: todayDateKey,
  });
};

/** Slice 1 テスト・動作確認用: 初期化動作確認向けの進行済みセーブを投入する */
export const seedResettableProgressSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave({
    ...base,
    currencies: { magatama: 450, hisui: 25 },
    permanentStats: { hpLevel: 2, atkLevel: 1, lukLevel: 1 },
    unlockedStageIds: ["stage_1_bamboo", "stage_2_old_road"],
    clearedStageIds: ["stage_1_bamboo"],
    lastLoginBonusDate: "2026-11-13",
  });
};
