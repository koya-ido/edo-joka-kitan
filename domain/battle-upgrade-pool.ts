import { WEAPON_UPGRADE_CAPS } from "@/domain/battle-upgrade-caps";
import { buildGenreSpecificOptions } from "@/domain/battle-upgrade-genre-pool";
import { MAX_SWORD_COMBO_BONUS } from "@/domain/battle-upgrade-sword-pool";
import type {
  InGameUpgradeOption,
  WeaponId,
  WeaponMaster,
  WeaponModifierState,
} from "@/types";

export { MAX_SWORD_COMBO_BONUS };

export const buildBaseStatOptions = (): readonly InGameUpgradeOption[] => [
  {
    id: "base_atk_pct",
    category: "base_stat",
    statType: "atk_pct",
    title: "霊力増幅",
    description: "全攻撃力 +25%",
    multiplierOrDelta: 1.25,
  },
  {
    id: "base_crit_rate",
    category: "base_stat",
    statType: "crit_rate",
    title: "心眼開眼",
    description: "会心発生率 +8%",
    multiplierOrDelta: 8,
  },
  {
    id: "base_crit_dmg",
    category: "base_stat",
    statType: "crit_dmg",
    title: "会心極意",
    description: "会心ダメージ倍率 +25%",
    multiplierOrDelta: 1.25,
  },
];

export const buildWeaponStatOptions = (
  unlockedWeaponIds: readonly WeaponId[],
  weaponMap: Readonly<Record<WeaponId, WeaponMaster>>,
  weaponModifiers?: Readonly<Record<string, WeaponModifierState>>,
): readonly InGameUpgradeOption[] => {
  const options: InGameUpgradeOption[] = [];
  for (const weaponId of unlockedWeaponIds) {
    if (!Object.hasOwn(weaponMap, weaponId)) continue;
    const weapon = weaponMap[weaponId];
    const mod =
      weaponModifiers && Object.hasOwn(weaponModifiers, weapon.id)
        ? weaponModifiers[weapon.id]
        : undefined;

    // 全武器共通3種（威力・攻撃頻度・攻撃範囲）
    if (
      (mod?.damageMultiplier ?? 1) < WEAPON_UPGRADE_CAPS.maxDamageMultiplier
    ) {
      options.push({
        id: `weapon_dmg_${weapon.id}`,
        category: "weapon_stat",
        targetWeaponId: weapon.id,
        statType: "weapon_dmg",
        title: `${weapon.name}・威力強化`,
        description: "ダメージ +30%",
        multiplierOrDelta: 1.3,
      });
    }
    if (
      (mod?.cooldownMultiplier ?? 1) > WEAPON_UPGRADE_CAPS.minCooldownMultiplier
    ) {
      options.push({
        id: `weapon_freq_${weapon.id}`,
        category: "weapon_stat",
        targetWeaponId: weapon.id,
        statType: "attack_freq",
        title: `${weapon.name}・連撃加速`,
        description: "攻撃頻度 +15%",
        multiplierOrDelta: 1 / 1.15,
      });
    }
    if ((mod?.rangeMultiplier ?? 1) < WEAPON_UPGRADE_CAPS.maxRangeMultiplier) {
      options.push({
        id: `weapon_range_${weapon.id}`,
        category: "weapon_stat",
        targetWeaponId: weapon.id,
        statType: "weapon_range",
        title: `${weapon.name}・攻撃範囲拡大`,
        description: "攻撃範囲 +25%",
        multiplierOrDelta: 1.25,
      });
    }
    options.push(...buildGenreSpecificOptions(weapon, mod));
  }
  return options;
};

export const buildWeaponUnlockOptions = (
  unlockedWeaponIds: readonly WeaponId[],
  allWeapons: readonly WeaponMaster[],
  maxActiveWeapons: number,
): readonly InGameUpgradeOption[] => {
  if (unlockedWeaponIds.length >= maxActiveWeapons) {
    return [];
  }
  return allWeapons
    .filter((weapon) => !unlockedWeaponIds.includes(weapon.id))
    .map((weapon) => ({
      id: `weapon_unlock_${weapon.id}`,
      category: "weapon_unlock" as const,
      targetWeaponId: weapon.id,
      title: `新武器開放：${weapon.name}`,
      description: `${weapon.name}を獲得`,
      multiplierOrDelta: 1,
    }));
};
