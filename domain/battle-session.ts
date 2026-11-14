import {
  CHARACTER_MASTER_MAP,
  STAGE_MASTER_MAP,
  WEAPON_MASTER_MAP,
} from "@/data";
import { calculateTotalMetaStats, type TotalMetaStats } from "@/domain/enhance";
import { err, ok } from "@/domain/result";
import { guardProtectedRouteAccess } from "@/domain/session-guard";
import type {
  CharacterMaster,
  DomainResult,
  OwnedCharacterState,
  OwnedWeaponState,
  PlayerSaveData,
  StageMaster,
  WeaponMaster,
} from "@/types";

/** バトルエンジン起動に必要な検証済みコンテキスト */
export interface BattleLaunchContext {
  readonly save: PlayerSaveData;
  readonly stage: StageMaster;
  readonly character: CharacterMaster;
  readonly ownedCharacter: OwnedCharacterState;
  readonly weapon: WeaponMaster;
  readonly ownedWeapon: OwnedWeaponState;
  readonly metaStats: TotalMetaStats;
}

/**
 * 401/403相当ガードを実行し、バトル起動用の検証済みコンテキストを生成する。
 * - 401相当: save 未確立・スキーマ破損 (`SAVE_CORRUPTED`)
 * - 403相当: ステージ不正/未解放、武器未選択/未所持、主人公未所持
 */
export const prepareBattleSession = (
  save: PlayerSaveData | null | undefined,
  stageId: string,
  stageMap: Readonly<Record<string, StageMaster>> = STAGE_MASTER_MAP,
  characterMap: Readonly<
    Record<string, CharacterMaster>
  > = CHARACTER_MASTER_MAP,
  weaponMap: Readonly<Record<string, WeaponMaster>> = WEAPON_MASTER_MAP,
): DomainResult<BattleLaunchContext> => {
  const accessResult = guardProtectedRouteAccess(save, stageId, stageMap);
  if (!accessResult.ok) {
    return accessResult;
  }

  const verifiedSave = accessResult.data;
  const stage = stageMap[stageId];

  if (!Object.hasOwn(characterMap, verifiedSave.equippedCharacterId)) {
    return err("UNOWNED_CHARACTER", "装備中の主人公マスタが見つかりません。");
  }
  if (!Object.hasOwn(weaponMap, verifiedSave.equippedWeaponId)) {
    return err("UNOWNED_WEAPON", "装備中の武器マスタが見つかりません。");
  }

  if (
    !Object.hasOwn(
      verifiedSave.ownedCharacters,
      verifiedSave.equippedCharacterId,
    )
  ) {
    return err("UNOWNED_CHARACTER", "装備中の主人公が未所持です。");
  }
  if (
    !Object.hasOwn(verifiedSave.ownedWeapons, verifiedSave.equippedWeaponId)
  ) {
    return err("UNOWNED_WEAPON", "装備中の武器が未所持です。");
  }

  const ownedCharacter =
    verifiedSave.ownedCharacters[verifiedSave.equippedCharacterId];
  const ownedWeapon = verifiedSave.ownedWeapons[verifiedSave.equippedWeaponId];

  const character = characterMap[verifiedSave.equippedCharacterId];
  const weapon = weaponMap[verifiedSave.equippedWeaponId];
  const metaStats = calculateTotalMetaStats(verifiedSave, character);

  return ok({
    save: verifiedSave,
    stage,
    character,
    ownedCharacter,
    weapon,
    ownedWeapon,
    metaStats,
  });
};
