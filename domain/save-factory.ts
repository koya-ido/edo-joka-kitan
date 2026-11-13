import {
  SAVE_SCHEMA_VERSION,
  type CharacterId,
  type OwnedCharacterState,
  type OwnedWeaponState,
  type PlayerSaveData,
  type WeaponId,
} from "@/types";

export const INITIAL_CHARACTER_ID = "apprentice_onmyoji" as const;
export const INITIAL_WEAPON_ID = "sword_hamon" as const;
export const INITIAL_STAGE_ID = "stage_1_bamboo" as const;
export const INITIAL_MAGATAMA = 100;
export const INITIAL_HISUI = 5;

/** 初回起動時およびセーブ初期化時に使用する初期セーブデータを生成する */
export const createInitialPlayerSave = (
  now: Date = new Date(),
): PlayerSaveData => {
  const nowIso = now.toISOString();
  const ownedCharacters = {
    [INITIAL_CHARACTER_ID]: {
      characterId: INITIAL_CHARACTER_ID,
      awakeningLevel: 0,
      obtainedAt: nowIso,
    },
  } as Record<CharacterId, OwnedCharacterState>;
  const ownedWeapons = {
    [INITIAL_WEAPON_ID]: {
      weaponId: INITIAL_WEAPON_ID,
      refineLevel: 0,
      obtainedAt: nowIso,
    },
  } as Record<WeaponId, OwnedWeaponState>;

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    currencies: {
      magatama: INITIAL_MAGATAMA,
      hisui: INITIAL_HISUI,
    },
    permanentStats: {
      hpLevel: 0,
      atkLevel: 0,
      lukLevel: 0,
    },
    ownedCharacters,
    ownedWeapons,
    equippedCharacterId: INITIAL_CHARACTER_ID,
    equippedWeaponId: INITIAL_WEAPON_ID,
    unlockedStageIds: [INITIAL_STAGE_ID],
    clearedStageIds: [],
    lastLoginBonusDate: null,
    updatedAt: nowIso,
  };
};
