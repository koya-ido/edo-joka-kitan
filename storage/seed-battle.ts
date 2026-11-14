import { CHARACTER_MASTERS, WEAPON_MASTERS } from "@/data";
import { createInitialPlayerSave } from "@/domain/save-factory";
import { seedPlayerSave } from "@/storage/seed";
import type {
  CharacterId,
  DomainResult,
  OwnedCharacterState,
  OwnedWeaponState,
  PlayerSaveData,
  WeaponId,
} from "@/types";

/**
 * Slice 6 テスト・動作確認用:
 * 初期状態（第壱節解放・初期主人公＋銘刀・波紋）のバトル出撃用セーブを投入する。
 */
export const seedBattleStarterSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave({
    ...base,
    unlockedStageIds: ["stage_1_bamboo"],
    clearedStageIds: [],
  });
};

/**
 * Slice 6 テスト・動作確認用:
 * 中盤進行状態（第壱節浄化済み・第弐節解放・永続強化済み）のセーブを投入する。
 */
export const seedBattleMidProgressSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave({
    ...base,
    currencies: { magatama: 300, hisui: 15 },
    permanentStats: { hpLevel: 3, atkLevel: 2, lukLevel: 2 },
    unlockedStageIds: ["stage_1_bamboo", "stage_2_old_road"],
    clearedStageIds: ["stage_1_bamboo"],
  });
};

/**
 * Slice 6 テスト・動作確認用:
 * 全3主人公・全9系統武器を所持し、全3節解放済みのバトル検証用セーブを投入する。
 */
export const seedBattleAllWeaponsReadySave = async (
  equippedCharacterId: CharacterId = "apprentice_onmyoji",
  equippedWeaponId: WeaponId = "sword_hamon",
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  const obtainedAt = now.toISOString();

  const ownedCharacters = Object.fromEntries(
    CHARACTER_MASTERS.map((character, index) => [
      character.id,
      {
        characterId: character.id,
        awakeningLevel: Math.min(index + 1, character.maxAwakeningLevel),
        obtainedAt,
      } satisfies OwnedCharacterState,
    ]),
  ) as Record<CharacterId, OwnedCharacterState>;

  const ownedWeapons = Object.fromEntries(
    WEAPON_MASTERS.map((weapon, index) => [
      weapon.id,
      {
        weaponId: weapon.id,
        refineLevel: Math.min(index % 3, weapon.maxRefineLevel),
        obtainedAt,
      } satisfies OwnedWeaponState,
    ]),
  ) as Record<WeaponId, OwnedWeaponState>;

  const resolvedCharId = Object.hasOwn(ownedCharacters, equippedCharacterId)
    ? equippedCharacterId
    : "apprentice_onmyoji";
  const resolvedWeaponId = Object.hasOwn(ownedWeapons, equippedWeaponId)
    ? equippedWeaponId
    : "sword_hamon";

  return seedPlayerSave({
    ...base,
    currencies: { magatama: 999, hisui: 50 },
    permanentStats: { hpLevel: 4, atkLevel: 4, lukLevel: 3 },
    ownedCharacters,
    ownedWeapons,
    equippedCharacterId: resolvedCharId,
    equippedWeaponId: resolvedWeaponId,
    unlockedStageIds: ["stage_1_bamboo", "stage_2_old_road", "stage_3_shrine"],
    clearedStageIds: ["stage_1_bamboo", "stage_2_old_road"],
  });
};
