import {
  CHARACTER_MASTER_MAP,
  ENHANCE_STAT_CONFIG_MAP,
  STAGE_MASTER_MAP,
  WEAPON_MASTER_MAP,
} from "@/data";
import { err, ok } from "@/domain/result";
import {
  SAVE_SCHEMA_VERSION,
  type CharacterMaster,
  type DomainResult,
  type PlayerSaveData,
  type StageMaster,
  type WeaponMaster,
} from "@/types";

export interface MasterCatalog {
  readonly characters: Readonly<Record<string, CharacterMaster>>;
  readonly weapons: Readonly<Record<string, WeaponMaster>>;
  readonly stages: Readonly<Record<string, StageMaster>>;
}

const DEFAULT_MASTERS: MasterCatalog = {
  characters: CHARACTER_MASTER_MAP,
  weapons: WEAPON_MASTER_MAP,
  stages: STAGE_MASTER_MAP,
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonNegativeInt = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  Number.isInteger(value) &&
  value >= 0;

const isValidIsoDate = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  !Number.isNaN(Date.parse(value));

const corrupted = (reason: string): DomainResult<never> =>
  err("SAVE_CORRUPTED", `セーブデータが破損しています（${reason}）。`);

const validateStageArrays = (
  unlocked: unknown,
  cleared: unknown,
  stages: Readonly<Record<string, StageMaster>>,
): DomainResult<true> => {
  if (!Array.isArray(unlocked) || !Array.isArray(cleared)) {
    return corrupted("ステージ進行形式不正");
  }
  const unlockedSet = new Set<string>();
  for (const id of unlocked) {
    if (
      typeof id !== "string" ||
      !Object.hasOwn(stages, id) ||
      unlockedSet.has(id)
    ) {
      return corrupted("解放済みステージ不正");
    }
    unlockedSet.add(id);
  }
  const clearedSet = new Set<string>();
  for (const id of cleared) {
    if (
      typeof id !== "string" ||
      !Object.hasOwn(stages, id) ||
      !unlockedSet.has(id) ||
      clearedSet.has(id)
    ) {
      return corrupted("クリア済みステージ整合性エラー");
    }
    clearedSet.add(id);
  }
  return ok(true);
};

const validateOwnedMaps = (
  ownedChars: unknown,
  ownedWeapons: unknown,
  masters: MasterCatalog,
): DomainResult<true> => {
  if (!isPlainObject(ownedChars) || !isPlainObject(ownedWeapons)) {
    return corrupted("所持マップ形式不正");
  }
  const charKeys = Object.keys(ownedChars);
  const weaponKeys = Object.keys(ownedWeapons);
  if (charKeys.length === 0 || weaponKeys.length === 0)
    return corrupted("初期所持データ欠損");
  for (const key of charKeys) {
    if (!Object.hasOwn(masters.characters, key))
      return corrupted("未知のキャラクターID");
    const entry = ownedChars[key];
    const maxLv = masters.characters[key].maxAwakeningLevel;
    if (
      !isPlainObject(entry) ||
      entry.characterId !== key ||
      !isNonNegativeInt(entry.awakeningLevel) ||
      entry.awakeningLevel > maxLv ||
      !isValidIsoDate(entry.obtainedAt)
    ) {
      return corrupted("所持キャラクター状態不正");
    }
  }
  for (const key of weaponKeys) {
    if (!Object.hasOwn(masters.weapons, key)) return corrupted("未知の武器ID");
    const entry = ownedWeapons[key];
    const maxLv = masters.weapons[key].maxRefineLevel;
    if (
      !isPlainObject(entry) ||
      entry.weaponId !== key ||
      !isNonNegativeInt(entry.refineLevel) ||
      entry.refineLevel > maxLv ||
      !isValidIsoDate(entry.obtainedAt)
    ) {
      return corrupted("所持武器状態不正");
    }
  }
  return ok(true);
};

/** 外部入力（IndexedDB読込データ）のランタイム整合性を検証する */
export const validatePlayerSaveData = (
  raw: unknown,
  masters: MasterCatalog = DEFAULT_MASTERS,
): DomainResult<PlayerSaveData> => {
  if (!isPlainObject(raw)) {
    return corrupted("オブジェクト形式不正");
  }
  if (
    !isNonNegativeInt(raw.schemaVersion) ||
    raw.schemaVersion < 1 ||
    raw.schemaVersion > SAVE_SCHEMA_VERSION
  ) {
    return corrupted("スキーマバージョン不正");
  }
  if (!isPlainObject(raw.currencies) || !isPlainObject(raw.permanentStats)) {
    return corrupted("通貨または永続強化構造欠損");
  }
  if (
    !isNonNegativeInt(raw.currencies.magatama) ||
    !isNonNegativeInt(raw.currencies.hisui) ||
    !isNonNegativeInt(raw.permanentStats.hpLevel) ||
    raw.permanentStats.hpLevel > ENHANCE_STAT_CONFIG_MAP.hpLevel.maxLevel ||
    !isNonNegativeInt(raw.permanentStats.atkLevel) ||
    raw.permanentStats.atkLevel > ENHANCE_STAT_CONFIG_MAP.atkLevel.maxLevel ||
    !isNonNegativeInt(raw.permanentStats.lukLevel) ||
    raw.permanentStats.lukLevel > ENHANCE_STAT_CONFIG_MAP.lukLevel.maxLevel
  ) {
    return corrupted("数値フィールド不正");
  }
  const ownedCheck = validateOwnedMaps(
    raw.ownedCharacters,
    raw.ownedWeapons,
    masters,
  );
  if (!ownedCheck.ok) {
    return ownedCheck;
  }
  const ownedChars = raw.ownedCharacters as Record<string, unknown>;
  const ownedWeapons = raw.ownedWeapons as Record<string, unknown>;
  if (
    typeof raw.equippedCharacterId !== "string" ||
    !Object.hasOwn(ownedChars, raw.equippedCharacterId) ||
    !Object.hasOwn(masters.characters, raw.equippedCharacterId)
  ) {
    return corrupted("装備キャラクター整合性エラー");
  }
  if (
    typeof raw.equippedWeaponId !== "string" ||
    raw.equippedWeaponId.length === 0 ||
    !Object.hasOwn(ownedWeapons, raw.equippedWeaponId) ||
    !Object.hasOwn(masters.weapons, raw.equippedWeaponId)
  ) {
    return corrupted("装備武器整合性エラー");
  }
  const stageCheck = validateStageArrays(
    raw.unlockedStageIds,
    raw.clearedStageIds,
    masters.stages,
  );
  if (!stageCheck.ok) {
    return stageCheck;
  }
  if (
    raw.lastLoginBonusDate !== null &&
    (typeof raw.lastLoginBonusDate !== "string" ||
      !DATE_KEY_PATTERN.test(raw.lastLoginBonusDate))
  ) {
    return corrupted("ログボ日付形式不正");
  }
  if (!isValidIsoDate(raw.updatedAt)) {
    return corrupted("更新日時形式不正");
  }
  return ok(raw as unknown as PlayerSaveData);
};

/** 旧バージョン互換マイグレーションを適用した上でランタイム検証を行う */
export const validateAndMigrateSave = (
  raw: unknown,
  masters: MasterCatalog = DEFAULT_MASTERS,
): DomainResult<PlayerSaveData> => validatePlayerSaveData(raw, masters);
