import { WEAPON_UPGRADE_CAPS } from "@/domain/battle-upgrade-caps";
import { err, ok } from "@/domain/result";
import type {
  DomainResult,
  InGameUpgradeOption,
  WeaponMaster,
  WeaponModifierState,
} from "@/types";

const addCapped = (
  current: number,
  delta: number,
  cap: number,
  msg: string,
): DomainResult<number> =>
  current >= cap
    ? err("ALREADY_MAX_LEVEL", msg)
    : ok(Math.min(cap, current + delta));

/** 武器個別のレベルアップ強化オプションを WeaponModifierState へ適用する */
export const applyWeaponModifierOption = (
  existing: WeaponModifierState,
  option: InGameUpgradeOption,
  weapon?: WeaponMaster,
): DomainResult<WeaponModifierState> => {
  const nextMod: WeaponModifierState = { ...existing };
  const st = option.statType;

  if (st === "weapon_dmg") {
    nextMod.damageMultiplier = Math.min(
      WEAPON_UPGRADE_CAPS.maxDamageMultiplier,
      nextMod.damageMultiplier * option.multiplierOrDelta,
    );
  } else if (st === "attack_freq") {
    nextMod.cooldownMultiplier = Math.max(
      WEAPON_UPGRADE_CAPS.minCooldownMultiplier,
      nextMod.cooldownMultiplier * option.multiplierOrDelta,
    );
  } else if (st === "duration") {
    nextMod.durationMultiplier = Math.min(
      WEAPON_UPGRADE_CAPS.maxDurationMultiplier,
      nextMod.durationMultiplier * option.multiplierOrDelta,
    );
  } else if (st === "weapon_range") {
    nextMod.rangeMultiplier = Math.min(
      WEAPON_UPGRADE_CAPS.maxRangeMultiplier,
      nextMod.rangeMultiplier * option.multiplierOrDelta,
    );
  } else if (st === "sword_slash_unlock") {
    if (nextMod.slashWaveEnabled) {
      return err("ALREADY_MAX_LEVEL", "斬撃発生はすでに習得済みです。");
    }
    nextMod.slashWaveEnabled = true;
  } else if (st === "sword_slash_size") {
    nextMod.slashWaveSizeMultiplier = Math.min(
      WEAPON_UPGRADE_CAPS.maxSlashWaveSizeMultiplier,
      nextMod.slashWaveSizeMultiplier * option.multiplierOrDelta,
    );
  } else if (st === "sword_slash_pierce_1" || st === "sword_slash_pierce_2") {
    const r = addCapped(
      nextMod.slashWavePierceBonus,
      option.multiplierOrDelta,
      WEAPON_UPGRADE_CAPS.maxSlashWavePierceBonus,
      "斬撃貫通数は上限です。",
    );
    if (!r.ok) return r;
    nextMod.slashWavePierceBonus = r.data;
    nextMod.damageMultiplier *= st === "sword_slash_pierce_1" ? 0.9 : 0.8;
  } else if (st === "sword_combo_1" || st === "sword_combo_2") {
    const r = addCapped(
      nextMod.comboBonus,
      option.multiplierOrDelta,
      WEAPON_UPGRADE_CAPS.maxSwordComboBonus,
      "連撃数は上限に達しています。",
    );
    if (!r.ok) return r;
    nextMod.comboBonus = r.data;
    nextMod.damageMultiplier *= st === "sword_combo_1" ? 0.85 : 0.75;
  } else if (st === "projectile_plus_1" || st === "projectile_plus_2") {
    const maxExtra =
      weapon?.genre === "shuriken"
        ? WEAPON_UPGRADE_CAPS.maxShurikenExtraProjectiles
        : WEAPON_UPGRADE_CAPS.maxExtraProjectiles;
    const r = addCapped(
      nextMod.extraProjectiles,
      option.multiplierOrDelta,
      maxExtra,
      "追加数は上限です。",
    );
    if (!r.ok) return r;
    nextMod.extraProjectiles = r.data;
    nextMod.damageMultiplier *= st === "projectile_plus_1" ? 0.85 : 0.75;
  } else if (st === "pierce_plus_1" || st === "pierce_plus_2") {
    const r = addCapped(
      nextMod.pierceBonus,
      option.multiplierOrDelta,
      WEAPON_UPGRADE_CAPS.maxPierceBonus,
      "貫通数は上限です。",
    );
    if (!r.ok) return r;
    nextMod.pierceBonus = r.data;
    nextMod.damageMultiplier *= st === "pierce_plus_1" ? 0.9 : 0.8;
  } else if (st === "bounce_plus_1" || st === "bounce_plus_2") {
    const r = addCapped(
      nextMod.bounceBonus,
      option.multiplierOrDelta,
      WEAPON_UPGRADE_CAPS.maxBounceBonus,
      "反射数は上限です。",
    );
    if (!r.ok) return r;
    nextMod.bounceBonus = r.data;
  } else if (st === "explosion_unlock") {
    if (nextMod.explosionEnabled) {
      return err("ALREADY_MAX_LEVEL", "爆発発生はすでに習得済みです。");
    }
    nextMod.explosionEnabled = true;
  } else if (
    st === "explosion_radius_30" ||
    st === "explosion_radius_50" ||
    st === "explosion_radius_100"
  ) {
    nextMod.explosionRadiusMultiplier = Math.min(
      WEAPON_UPGRADE_CAPS.maxExplosionRadiusMultiplier,
      nextMod.explosionRadiusMultiplier * option.multiplierOrDelta,
    );
  } else if (st === "split_unlock") {
    if (nextMod.splitEnabled) {
      return err("ALREADY_MAX_LEVEL", "分裂発生はすでに習得済みです。");
    }
    nextMod.splitEnabled = true;
  } else if (st === "split_pierce_plus_1" || st === "split_pierce_plus_2") {
    const r = addCapped(
      nextMod.splitPierceBonus,
      option.multiplierOrDelta,
      WEAPON_UPGRADE_CAPS.maxSplitPierceBonus,
      "分裂弾貫通は上限です。",
    );
    if (!r.ok) return r;
    nextMod.splitPierceBonus = r.data;
    nextMod.damageMultiplier *= st === "split_pierce_plus_1" ? 0.9 : 0.8;
  } else if (st === "split_bounce_plus_1") {
    const r = addCapped(
      nextMod.splitBounceBonus,
      option.multiplierOrDelta,
      WEAPON_UPGRADE_CAPS.maxSplitBounceBonus,
      "分裂弾反射は上限です。",
    );
    if (!r.ok) return r;
    nextMod.splitBounceBonus = r.data;
  } else if (st === "talisman_chain_plus_1" || st === "talisman_chain_plus_2") {
    const r = addCapped(
      nextMod.chainBonus,
      option.multiplierOrDelta,
      WEAPON_UPGRADE_CAPS.maxTalismanChainBonus,
      "連鎖数は上限です。",
    );
    if (!r.ok) return r;
    nextMod.chainBonus = r.data;
  } else if (st === "fan_knockback_pct") {
    nextMod.knockbackMultiplier = Math.min(
      WEAPON_UPGRADE_CAPS.maxKnockbackMultiplier,
      nextMod.knockbackMultiplier * option.multiplierOrDelta,
    );
  } else if (st === "debuff_unlock") {
    const r = addCapped(
      nextMod.debuffLevel,
      option.multiplierOrDelta,
      WEAPON_UPGRADE_CAPS.maxDebuffLevel,
      "デバフは上限です。",
    );
    if (!r.ok) return r;
    nextMod.debuffLevel = r.data;
  } else {
    return err("STORAGE_ERROR", "不明な武器強化種別です。");
  }

  return ok(nextMod);
};
