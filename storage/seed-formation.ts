import { createInitialPlayerSave } from "@/domain/save-factory";
import { seedPlayerSave } from "@/storage/seed";
import type { DomainResult, PlayerSaveData } from "@/types";

/**
 * Slice 4 テスト・動作確認用:
 * 複数キャラ（apprentice_onmyoji, white_fox_miko）・複数武器（sword_hamon, bow_azusa, shuriken_kaze）を所持し、
 * 未所持キャラ（shadow_shinobi）を意図的に残した編成切替検証用セーブを投入する。
 */
export const seedFormationMultiOwnedSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  const nowIso = now.toISOString();
  return seedPlayerSave({
    ...base,
    permanentStats: { hpLevel: 2, atkLevel: 1, lukLevel: 1 },
    ownedCharacters: {
      ...base.ownedCharacters,
      white_fox_miko: {
        characterId: "white_fox_miko",
        awakeningLevel: 1,
        obtainedAt: nowIso,
      },
    },
    ownedWeapons: {
      ...base.ownedWeapons,
      bow_azusa: {
        weaponId: "bow_azusa",
        refineLevel: 2,
        obtainedAt: nowIso,
      },
      shuriken_kaze: {
        weaponId: "shuriken_kaze",
        refineLevel: 0,
        obtainedAt: nowIso,
      },
    },
    equippedCharacterId: "apprentice_onmyoji",
  });
};

/**
 * Slice 4 テスト・動作確認用:
 * 初期キャラ・初期武器の1種ずつしか所持していない（Empty 案内確認用）セーブを投入する。
 */
export const seedFormationSingleOwnedSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave(base);
};
