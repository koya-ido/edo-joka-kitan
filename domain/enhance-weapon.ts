import { WEAPON_MASTER_MAP, WEAPON_REFINE_COST_CONFIG } from "@/data";
import { guardCurrencySufficient } from "@/domain/currency-guard";
import { err, ok } from "@/domain/result";
import type {
  DomainResult,
  PlayerSaveData,
  WeaponId,
  WeaponMaster,
} from "@/types";

export interface WeaponRefineCheckResult {
  readonly weaponMaster: WeaponMaster;
  readonly currentRefineLevel: number;
  readonly cost: number;
}

/** 現在の精錬レベルから次レベル強化に必要な水晶の勾玉数を算出する */
export const calculateWeaponRefineCost = (
  currentRefineLevel: number,
): number => {
  const safeLevel =
    Number.isFinite(currentRefineLevel) && currentRefineLevel >= 0
      ? Math.floor(currentRefineLevel)
      : 0;
  return (
    WEAPON_REFINE_COST_CONFIG.baseCostMagatama +
    safeLevel * WEAPON_REFINE_COST_CONFIG.costStepMagatama
  );
};

/** 武器精錬が実行可能か（存在・所持・最大精錬Lv未到達・勾玉残高十分）を検証する（403相当ガード） */
export const guardWeaponRefineable = (
  save: PlayerSaveData,
  weaponId: WeaponId,
  weaponMap: Readonly<Record<string, WeaponMaster>> = WEAPON_MASTER_MAP,
): DomainResult<WeaponRefineCheckResult> => {
  if (weaponId.trim().length === 0 || !Object.hasOwn(weaponMap, weaponId)) {
    return err("SAVE_CORRUPTED", "未知の武器が指定されました。");
  }
  if (!Object.hasOwn(save.ownedWeapons, weaponId)) {
    return err("UNOWNED_WEAPON", "未所持の武器は強化できません。");
  }

  const weaponMaster = weaponMap[weaponId];
  const currentRefineLevel = save.ownedWeapons[weaponId].refineLevel;
  if (currentRefineLevel >= weaponMaster.maxRefineLevel) {
    return err(
      "ALREADY_MAX_LEVEL",
      "この武器は既に最大精錬レベルに達しています。",
    );
  }

  const cost = calculateWeaponRefineCost(currentRefineLevel);
  const currencyGuard = guardCurrencySufficient(save, "magatama", cost);
  if (!currencyGuard.ok) {
    return currencyGuard;
  }

  return ok({
    weaponMaster,
    currentRefineLevel,
    cost,
  });
};

/** 武器精錬を適用した新しいセーブデータをイミュータブルに生成する */
export const applyWeaponRefine = (
  save: PlayerSaveData,
  weaponId: WeaponId,
  weaponMap: Readonly<Record<string, WeaponMaster>> = WEAPON_MASTER_MAP,
  now: Date = new Date(),
): DomainResult<PlayerSaveData> => {
  const guard = guardWeaponRefineable(save, weaponId, weaponMap);
  if (!guard.ok) {
    return guard;
  }

  const { currentRefineLevel, cost } = guard.data;
  const ownedWeapon = save.ownedWeapons[weaponId];

  return ok({
    ...save,
    currencies: {
      ...save.currencies,
      magatama: save.currencies.magatama - cost,
    },
    ownedWeapons: {
      ...save.ownedWeapons,
      [weaponId]: {
        ...ownedWeapon,
        refineLevel: currentRefineLevel + 1,
      },
    },
    updatedAt: now.toISOString(),
  });
};
