import { CHARACTER_MASTERS, WEAPON_MASTERS } from "@/data";
import { err, ok } from "@/domain/result";
import { createInitialPlayerSave } from "@/domain/save-factory";
import { validatePlayerSaveData } from "@/domain/save-validator";
import { openPlayerDb } from "@/storage/player-db";
import {
  SAVE_RECORD_KEY,
  type CharacterId,
  type DomainResult,
  type OwnedCharacterState,
  type OwnedWeaponState,
  type PlayerSaveData,
  type WeaponId,
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

/** Slice 2 テスト・動作確認用: 勾玉不足状態（最小コスト20未満）のセーブを投入する */
export const seedEnhanceInsufficientMagatamaSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave({
    ...base,
    currencies: { ...base.currencies, magatama: 10 },
    permanentStats: { hpLevel: 0, atkLevel: 0, lukLevel: 0 },
  });
};

/** Slice 2 テスト・動作確認用: 一部・全強化項目が最大レベル到達済みのセーブを投入する */
export const seedEnhanceMaxedStatSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave({
    ...base,
    currencies: { ...base.currencies, magatama: 500 },
    permanentStats: { hpLevel: 20, atkLevel: 20, lukLevel: 15 },
  });
};

/** Slice 2 テスト・動作確認用: 強化途中段階（加算合算確認用）のセーブを投入する */
export const seedEnhanceMidProgressSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave({
    ...base,
    currencies: { ...base.currencies, magatama: 300 },
    permanentStats: { hpLevel: 3, atkLevel: 2, lukLevel: 1 },
  });
};

/** Slice 3 テスト・動作確認用: 単発・10連ガチャが実行可能な翡翠所持セーブを投入する */
export const seedGachaReadySave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave({
    ...base,
    currencies: { ...base.currencies, hisui: 55 },
  });
};

/** Slice 3 テスト・動作確認用: 翡翠不足状態（単発コスト5未満）のセーブを投入する */
export const seedGachaInsufficientHisuiSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave({
    ...base,
    currencies: { ...base.currencies, hisui: 3 },
  });
};

/** Slice 3 テスト・動作確認用: 単発のみ実行可能・10連不可（翡翠12）のセーブを投入する */
export const seedGachaSingleOnlyHisuiSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave({
    ...base,
    currencies: { ...base.currencies, hisui: 12 },
  });
};

/** Slice 3 テスト・動作確認用: 全キャラ・全武器が上限Lv到達済み（余剰勾玉変換確認用）のセーブを投入する */
export const seedGachaMaxedPoolSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  const nowIso = now.toISOString();
  const ownedCharacters = Object.fromEntries(
    CHARACTER_MASTERS.map((character) => [
      character.id,
      {
        characterId: character.id,
        awakeningLevel: character.maxAwakeningLevel,
        obtainedAt: nowIso,
      },
    ]),
  ) as Record<CharacterId, OwnedCharacterState>;
  const ownedWeapons = Object.fromEntries(
    WEAPON_MASTERS.map((weapon) => [
      weapon.id,
      {
        weaponId: weapon.id,
        refineLevel: weapon.maxRefineLevel,
        obtainedAt: nowIso,
      },
    ]),
  ) as Record<WeaponId, OwnedWeaponState>;
  return seedPlayerSave({
    ...base,
    currencies: { ...base.currencies, hisui: 50 },
    ownedCharacters,
    ownedWeapons,
  });
};
