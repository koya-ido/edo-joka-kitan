import type { TotalMetaStats } from "@/domain";
import type { ResolvedPassiveBonus } from "@/engine/types";
import type { CharacterMaster, InGameBuffState, WeaponMaster } from "@/types";

export interface DamageRollResult {
  readonly damage: number;
  readonly isCrit: boolean;
}

/** 主人公固有パッシブスキル（3種）のバトル適用値を解決する */
export const resolveCharacterPassive = (
  character: CharacterMaster,
  awakeningLevel: number,
): ResolvedPassiveBonus => {
  const safeAwakening = Math.max(0, Math.floor(awakeningLevel));
  const { effectType, baseValue, valuePerAwakening } = character.passiveSkill;
  const value = baseValue + safeAwakening * valuePerAwakening;

  return {
    effectType,
    value,
    barrierRegenPerSec: effectType === "barrier_regen" ? value : 0,
    critRateBonusPct: effectType === "luk_and_drop_boost" ? value : 0,
    expMultiplier: effectType === "luk_and_drop_boost" ? 1 + value / 100 : 1,
    cooldownMultiplier:
      effectType === "attack_speed_boost" ? 1 / (1 + value / 100) : 1,
  };
};

/** 武器の有効クールダウン（ms）を算出する */
export const calculateEffectiveCooldownMs = (
  weapon: WeaponMaster,
  buffState: InGameBuffState,
  passive: ResolvedPassiveBonus,
): number => {
  const weaponCdMult = Object.hasOwn(buffState.weaponModifiers, weapon.id)
    ? buffState.weaponModifiers[weapon.id].cooldownMultiplier
    : 1;
  const raw = weapon.baseCooldownMs * weaponCdMult * passive.cooldownMultiplier;
  return Math.max(120, Math.round(raw));
};

/** 武器の有効持続時間（ms）を算出する */
export const calculateEffectiveDurationMs = (
  weapon: WeaponMaster,
  buffState: InGameBuffState,
): number => {
  const durationMult = Object.hasOwn(buffState.weaponModifiers, weapon.id)
    ? buffState.weaponModifiers[weapon.id].durationMultiplier
    : 1;
  return Math.max(0, Math.round(weapon.baseDurationMs * durationMult));
};

/**
 * 1ヒットあたりのダメージと会心判定を算出する。
 * メタ基礎ATK係数 * 武器基礎+精錬 * ラン内複利乗算バフ * 会心倍率
 */
export const calculateWeaponDamage = (
  weapon: WeaponMaster,
  refineLevel: number,
  metaStats: TotalMetaStats,
  buffState: InGameBuffState,
  passive: ResolvedPassiveBonus,
  rng: () => number = Math.random,
): DamageRollResult => {
  const safeRefine = Math.max(0, Math.floor(refineLevel));
  const weaponPower = weapon.baseDamage + safeRefine * weapon.damagePerRefine;
  const atkFactor = Math.max(0.5, metaStats.atk / 20);
  const weaponDamageMult = Object.hasOwn(buffState.weaponModifiers, weapon.id)
    ? buffState.weaponModifiers[weapon.id].damageMultiplier
    : 1;

  const baseDamage =
    weaponPower * atkFactor * buffState.atkMultiplier * weaponDamageMult;

  const critChancePct = Math.min(
    100,
    Math.max(
      0,
      metaStats.luk + passive.critRateBonusPct + buffState.critRateBonusPct,
    ),
  );
  const isCrit = rng() * 100 < critChancePct;
  const finalDamage = isCrit
    ? baseDamage * buffState.critDamageMultiplier
    : baseDamage;

  return {
    damage: Math.max(1, Math.round(finalDamage)),
    isCrit,
  };
};

/** レベルアップに必要な霊力 EXP を算出する */
export const calculateExpToNextLevel = (level: number): number => {
  const safeLevel = Math.max(1, Math.floor(level));
  return 40 + (safeLevel - 1) * 25;
};
