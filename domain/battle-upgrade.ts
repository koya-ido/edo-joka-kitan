import { applyWeaponModifierOption } from "@/domain/battle-upgrade-apply";
import {
  buildBaseStatOptions,
  buildWeaponStatOptions,
  buildWeaponUnlockOptions,
} from "@/domain/battle-upgrade-pool";
import { sampleWeightedUpgradeOptions } from "@/domain/battle-upgrade-weights";
import { err, ok } from "@/domain/result";
import type {
  DomainResult,
  InGameBuffState,
  InGameUpgradeOption,
  WeaponId,
  WeaponMaster,
  WeaponModifierState,
} from "@/types";

export const MAX_ACTIVE_WEAPONS_IN_RUN = 3 as const;

export interface GenerateUpgradeChoicesInput {
  readonly buffState: InGameBuffState;
  readonly weaponMap: Readonly<Record<WeaponId, WeaponMaster>>;
  readonly allWeapons: readonly WeaponMaster[];
  readonly ownedWeaponIds?: readonly WeaponId[];
  readonly maxActiveWeapons?: number;
  readonly choiceCount?: number;
  readonly rng?: () => number;
}

export const createDefaultWeaponModifier = (): WeaponModifierState => ({
  damageMultiplier: 1,
  cooldownMultiplier: 1,
  durationMultiplier: 1,
  rangeMultiplier: 1,
  slashWaveEnabled: false,
  slashWaveSizeMultiplier: 1,
  slashWavePierceBonus: 0,
  comboBonus: 0,
  extraProjectiles: 0,
  pierceBonus: 0,
  bounceBonus: 0,
  explosionEnabled: false,
  explosionRadiusMultiplier: 1,
  splitEnabled: false,
  splitPierceBonus: 0,
  splitBounceBonus: 0,
  chainBonus: 0,
  knockbackMultiplier: 1,
  debuffLevel: 0,
});

/**
 * レベルアップ時の3択候補を生成する。
 * 同時発動枠が上限（3枠）に達している場合は `weapon_unlock` を確実に除外する。
 */
export const generateUpgradeChoices = (
  input: GenerateUpgradeChoicesInput,
): readonly InGameUpgradeOption[] => {
  const maxWeapons = input.maxActiveWeapons ?? MAX_ACTIVE_WEAPONS_IN_RUN;
  const choiceCount = Math.max(1, input.choiceCount ?? 3);
  const rng = input.rng ?? Math.random;

  const unlockCandidateWeapons = input.ownedWeaponIds
    ? input.allWeapons.filter((weapon) =>
        input.ownedWeaponIds?.includes(weapon.id),
      )
    : input.allWeapons;

  const pool: InGameUpgradeOption[] = [
    ...buildBaseStatOptions(),
    ...buildWeaponStatOptions(
      input.buffState.unlockedWeaponIds,
      input.weaponMap,
      input.buffState.weaponModifiers,
    ),
    ...buildWeaponUnlockOptions(
      input.buffState.unlockedWeaponIds,
      unlockCandidateWeapons,
      maxWeapons,
    ),
  ];

  return sampleWeightedUpgradeOptions(pool, choiceCount, rng);
};

/**
 * 選択された3択スキルをラン内バフ状態へ純粋適用する（基本ステータスは複利乗算）。
 */
export const applyUpgradeOption = (
  buffState: InGameBuffState,
  option: InGameUpgradeOption,
  weaponMap: Readonly<Record<WeaponId, WeaponMaster>>,
  maxActiveWeapons: number = MAX_ACTIVE_WEAPONS_IN_RUN,
): DomainResult<InGameBuffState> => {
  if (option.category === "base_stat") {
    if (option.statType === "atk_pct") {
      return ok({
        ...buffState,
        atkMultiplier: buffState.atkMultiplier * option.multiplierOrDelta,
      });
    }
    if (option.statType === "crit_rate") {
      return ok({
        ...buffState,
        critRateBonusPct: buffState.critRateBonusPct + option.multiplierOrDelta,
      });
    }
    if (option.statType === "crit_dmg") {
      return ok({
        ...buffState,
        critDamageMultiplier:
          buffState.critDamageMultiplier * option.multiplierOrDelta,
      });
    }
    return err("STORAGE_ERROR", "不明な基本ステータス強化種別です。");
  }

  const targetId = option.targetWeaponId;
  if (!targetId || !Object.hasOwn(weaponMap, targetId)) {
    return err("UNOWNED_WEAPON", "対象武器がマスタに存在しません。");
  }

  if (option.category === "weapon_unlock") {
    if (buffState.unlockedWeaponIds.length >= maxActiveWeapons) {
      return err("ALREADY_MAX_LEVEL", "同時発動武器の上限に達しています。");
    }
    if (buffState.unlockedWeaponIds.includes(targetId)) {
      return err("ALREADY_MAX_LEVEL", "この武器は既に開放済みです。");
    }
    return ok({
      ...buffState,
      unlockedWeaponIds: [...buffState.unlockedWeaponIds, targetId],
      weaponModifiers: {
        ...buffState.weaponModifiers,
        [targetId]: createDefaultWeaponModifier(),
      },
    });
  }

  const existing = Object.hasOwn(buffState.weaponModifiers, targetId)
    ? buffState.weaponModifiers[targetId]
    : createDefaultWeaponModifier();

  const modResult = applyWeaponModifierOption(existing, option);
  if (!modResult.ok) return modResult;

  return ok({
    ...buffState,
    weaponModifiers: {
      ...buffState.weaponModifiers,
      [targetId]: modResult.data,
    },
  });
};

/**
 * バトル開始時の初期武器選択肢を生成する。
 * 所持武器が2個以上の場合に最大3個までランダムに抽出する。
 */
export const generateInitialWeaponChoices = (
  ownedWeapons: readonly WeaponMaster[],
  rng: () => number = Math.random,
  maxChoices = 3,
): readonly InGameUpgradeOption[] => {
  const shuffled = [...ownedWeapons];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  const picked = shuffled.slice(0, Math.min(maxChoices, shuffled.length));
  return buildWeaponUnlockOptions([], picked, maxChoices);
};
