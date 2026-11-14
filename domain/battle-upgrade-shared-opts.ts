import { WEAPON_UPGRADE_CAPS } from "@/domain/battle-upgrade-caps";
import type {
  InGameStatType,
  InGameUpgradeOption,
  WeaponMaster,
  WeaponModifierState,
} from "@/types";

export const makeWeaponStatOpt = (
  weapon: WeaponMaster,
  statType: InGameStatType,
  idPrefix: string,
  titleSuffix: string,
  description: string,
  multiplierOrDelta: number,
): InGameUpgradeOption => ({
  id: `${idPrefix}_${weapon.id}`,
  category: "weapon_stat",
  targetWeaponId: weapon.id,
  statType,
  title: `${weapon.name}・${titleSuffix}`,
  description,
  multiplierOrDelta,
});

export const buildProjectileCountOpts = (
  weapon: WeaponMaster,
  mod: WeaponModifierState | undefined,
  label: string,
): InGameUpgradeOption[] => {
  const cur = mod?.extraProjectiles ?? 0;
  const opts: InGameUpgradeOption[] = [];
  if (cur < WEAPON_UPGRADE_CAPS.maxExtraProjectiles) {
    opts.push(
      makeWeaponStatOpt(
        weapon,
        "projectile_plus_1",
        "projectile_plus_1",
        `${label}+1`,
        `${label} +1`,
        1,
      ),
    );
  }
  if (cur + 2 <= WEAPON_UPGRADE_CAPS.maxExtraProjectiles) {
    opts.push(
      makeWeaponStatOpt(
        weapon,
        "projectile_plus_2",
        "projectile_plus_2",
        `${label}+2`,
        `${label} +2`,
        2,
      ),
    );
  }
  return opts;
};

export const buildPierceOpts = (
  weapon: WeaponMaster,
  mod?: WeaponModifierState,
): InGameUpgradeOption[] => {
  const cur = mod?.pierceBonus ?? 0;
  const opts: InGameUpgradeOption[] = [];
  if (cur < WEAPON_UPGRADE_CAPS.maxPierceBonus) {
    opts.push(
      makeWeaponStatOpt(
        weapon,
        "pierce_plus_1",
        "pierce_plus_1",
        "貫通+1",
        "貫通数 +1",
        1,
      ),
    );
  }
  if (cur + 2 <= WEAPON_UPGRADE_CAPS.maxPierceBonus) {
    opts.push(
      makeWeaponStatOpt(
        weapon,
        "pierce_plus_2",
        "pierce_plus_2",
        "貫通+2",
        "貫通数 +2",
        2,
      ),
    );
  }
  return opts;
};

export const buildBounceOpts = (
  weapon: WeaponMaster,
  mod?: WeaponModifierState,
  label = "反射",
): InGameUpgradeOption[] => {
  const cur = mod?.bounceBonus ?? 0;
  const opts: InGameUpgradeOption[] = [];
  if (cur < WEAPON_UPGRADE_CAPS.maxBounceBonus) {
    opts.push(
      makeWeaponStatOpt(
        weapon,
        "bounce_plus_1",
        "bounce_plus_1",
        `${label}+1`,
        `${label}回数 +1`,
        1,
      ),
    );
  }
  if (cur + 2 <= WEAPON_UPGRADE_CAPS.maxBounceBonus) {
    opts.push(
      makeWeaponStatOpt(
        weapon,
        "bounce_plus_2",
        "bounce_plus_2",
        `${label}+2`,
        `${label}回数 +2`,
        2,
      ),
    );
  }
  return opts;
};

export const buildSplitOpts = (
  weapon: WeaponMaster,
  mod?: WeaponModifierState,
): InGameUpgradeOption[] => {
  if (!mod?.splitEnabled) {
    return [
      makeWeaponStatOpt(
        weapon,
        "split_unlock",
        "split_unlock",
        "分裂発生+2",
        "初着弾時に子弾へ2分裂",
        2,
      ),
    ];
  }
  const opts: InGameUpgradeOption[] = [];
  if (mod.splitPierceBonus < WEAPON_UPGRADE_CAPS.maxSplitPierceBonus) {
    opts.push(
      makeWeaponStatOpt(
        weapon,
        "split_pierce_plus_1",
        "split_pierce_plus_1",
        "分裂弾貫通+1",
        "分裂子弾の貫通数 +1",
        1,
      ),
    );
  }
  if (mod.splitPierceBonus + 2 <= WEAPON_UPGRADE_CAPS.maxSplitPierceBonus) {
    opts.push(
      makeWeaponStatOpt(
        weapon,
        "split_pierce_plus_2",
        "split_pierce_plus_2",
        "分裂弾貫通+2",
        "分裂子弾の貫通数 +2",
        2,
      ),
    );
  }
  if (mod.splitBounceBonus < WEAPON_UPGRADE_CAPS.maxSplitBounceBonus) {
    opts.push(
      makeWeaponStatOpt(
        weapon,
        "split_bounce_plus_1",
        "split_bounce_plus_1",
        "分裂弾反射+1",
        "分裂子弾の画面端反射 +1",
        1,
      ),
    );
  }
  return opts;
};

export const buildUniqueExplosionOpts = (
  weapon: WeaponMaster,
  mod?: WeaponModifierState,
): InGameUpgradeOption[] => {
  const hasNativeExplosion =
    weapon.uniqueSkills?.includes("explosion") ?? false;
  if (!hasNativeExplosion && !mod?.explosionEnabled) {
    return [];
  }
  if (
    (mod?.explosionRadiusMultiplier ?? 1) >=
    WEAPON_UPGRADE_CAPS.maxExplosionRadiusMultiplier
  ) {
    return [];
  }
  return [
    makeWeaponStatOpt(
      weapon,
      "explosion_radius_30",
      "explosion_radius_30",
      "爆発範囲+30%",
      "爆発範囲 +30%",
      1.3,
    ),
    makeWeaponStatOpt(
      weapon,
      "explosion_radius_50",
      "explosion_radius_50",
      "爆発範囲+50%",
      "爆発範囲 +50%",
      1.5,
    ),
    makeWeaponStatOpt(
      weapon,
      "explosion_radius_100",
      "explosion_radius_100",
      "爆発範囲+100%",
      "爆発範囲 +100%",
      2,
    ),
  ];
};

export const buildDebuffOpts = (
  weapon: WeaponMaster,
  mod?: WeaponModifierState,
): InGameUpgradeOption[] => {
  if (weapon.uniqueSkills?.includes("debuff")) return [];
  if ((mod?.debuffLevel ?? 0) >= WEAPON_UPGRADE_CAPS.maxDebuffLevel) return [];
  return [
    makeWeaponStatOpt(
      weapon,
      "debuff_unlock",
      "debuff_unlock",
      "デバフ付与",
      "命中敵に鈍足・被ダメージ増加を付与",
      1,
    ),
  ];
};
