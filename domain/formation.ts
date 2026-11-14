import {
  CHARACTER_MASTERS,
  CHARACTER_MASTER_MAP,
  WEAPON_MASTERS,
  WEAPON_MASTER_MAP,
} from "@/data";
import { err, ok } from "@/domain/result";
import type {
  CharacterId,
  CharacterMaster,
  DomainResult,
  OwnedCharacterState,
  OwnedWeaponState,
  PlayerSaveData,
  WeaponGenre,
  WeaponId,
  WeaponMaster,
} from "@/types";

export interface FormationSelectionInput {
  readonly characterId: CharacterId;
  readonly weaponId: WeaponId;
}

export interface OwnedCharacterEntry {
  readonly master: CharacterMaster;
  readonly state: OwnedCharacterState;
  readonly isEquipped: boolean;
}

export interface OwnedWeaponEntry {
  readonly master: WeaponMaster;
  readonly state: OwnedWeaponState;
  readonly isEquipped: boolean;
}

export const WEAPON_GENRE_LABELS: Readonly<Record<WeaponGenre, string>> =
  Object.freeze({
    bow: "弓矢系",
    sword: "刀剣系",
    shuriken: "手裏剣系",
    mirror: "鏡系",
    talisman: "呪符系",
    matchlock: "火縄銃系",
    fan: "扇・軍配系",
    bell: "神具・鈴系",
    orb: "霊珠・勾玉系",
  });

/**
 * 403相当ガード: 選択された主人公・持ち込み武器が所持済みかつマスタに存在し、
 * 武器が空選択でないことを検証する。
 */
export const guardEquipmentSelection = (
  save: PlayerSaveData,
  characterId: string,
  weaponId: string,
  charMap: Readonly<Record<string, CharacterMaster>> = CHARACTER_MASTER_MAP,
  weaponMap: Readonly<Record<string, WeaponMaster>> = WEAPON_MASTER_MAP,
): DomainResult<FormationSelectionInput> => {
  if (weaponId.trim().length === 0) {
    return err("EMPTY_WEAPON_SELECTION", "持ち込み武器を1つ選択してください。");
  }

  if (
    characterId.trim().length === 0 ||
    !Object.hasOwn(charMap, characterId) ||
    !Object.hasOwn(save.ownedCharacters, characterId)
  ) {
    return err(
      "UNOWNED_CHARACTER",
      "未所持または存在しない主人公は編成できません。",
    );
  }

  if (
    !Object.hasOwn(weaponMap, weaponId) ||
    !Object.hasOwn(save.ownedWeapons, weaponId)
  ) {
    return err(
      "UNOWNED_WEAPON",
      "未所持または存在しない武器は編成できません。",
    );
  }

  return ok({
    characterId,
    weaponId,
  });
};

/** 編成変更を検証・適用した新しいセーブデータをイミュータブルに生成する */
export const applyFormationChange = (
  save: PlayerSaveData,
  selection: FormationSelectionInput,
  now: Date = new Date(),
  charMap: Readonly<Record<string, CharacterMaster>> = CHARACTER_MASTER_MAP,
  weaponMap: Readonly<Record<string, WeaponMaster>> = WEAPON_MASTER_MAP,
): DomainResult<PlayerSaveData> => {
  const guard = guardEquipmentSelection(
    save,
    selection.characterId,
    selection.weaponId,
    charMap,
    weaponMap,
  );
  if (!guard.ok) {
    return guard;
  }

  return ok({
    ...save,
    equippedCharacterId: guard.data.characterId,
    equippedWeaponId: guard.data.weaponId,
    updatedAt: now.toISOString(),
  });
};

/** 所持済みの主人公一覧をマスタ表示順で抽出する（未所持は含めない） */
export const getOwnedCharacterEntries = (
  save: PlayerSaveData,
  charMasters: readonly CharacterMaster[] = CHARACTER_MASTERS,
): readonly OwnedCharacterEntry[] =>
  charMasters
    .filter((master) => Object.hasOwn(save.ownedCharacters, master.id))
    .map((master) => ({
      master,
      state: save.ownedCharacters[master.id],
      isEquipped: save.equippedCharacterId === master.id,
    }));

/** 所持済みの武器一覧をマスタ表示順で抽出する（未所持は含めない） */
export const getOwnedWeaponEntries = (
  save: PlayerSaveData,
  weaponMasters: readonly WeaponMaster[] = WEAPON_MASTERS,
): readonly OwnedWeaponEntry[] =>
  weaponMasters
    .filter((master) => Object.hasOwn(save.ownedWeapons, master.id))
    .map((master) => ({
      master,
      state: save.ownedWeapons[master.id],
      isEquipped: save.equippedWeaponId === master.id,
    }));

/** 覚醒レベルを加味した固有パッシブ効果値を算出する */
export const getPassiveEffectValue = (
  master: CharacterMaster,
  awakeningLevel: number,
): number =>
  Number(
    (
      master.passiveSkill.baseValue +
      awakeningLevel * master.passiveSkill.valuePerAwakening
    ).toFixed(1),
  );

/** 精錬レベルを加味した武器の実効基本威力を算出する */
export const getWeaponEffectiveDamage = (
  master: WeaponMaster,
  refineLevel: number,
): number => master.baseDamage + refineLevel * master.damagePerRefine;
