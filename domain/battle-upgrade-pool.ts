import type { InGameUpgradeOption, WeaponId, WeaponMaster } from "@/types";

export const buildBaseStatOptions = (): readonly InGameUpgradeOption[] => [
  {
    id: "base_atk_pct",
    category: "base_stat",
    statType: "atk_pct",
    title: "霊力増幅",
    description: "全攻撃力 ×1.25（複利乗算）",
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
    description: "会心ダメージ倍率 ×1.25（複利乗算）",
    multiplierOrDelta: 1.25,
  },
];

export const buildWeaponStatOptions = (
  unlockedWeaponIds: readonly WeaponId[],
  weaponMap: Readonly<Record<WeaponId, WeaponMaster>>,
): readonly InGameUpgradeOption[] => {
  const options: InGameUpgradeOption[] = [];
  for (const weaponId of unlockedWeaponIds) {
    if (!Object.hasOwn(weaponMap, weaponId)) continue;
    const weapon = weaponMap[weaponId];
    options.push(
      {
        id: `weapon_dmg_${weapon.id}`,
        category: "weapon_stat",
        targetWeaponId: weapon.id,
        statType: "weapon_dmg",
        title: `${weapon.name}・威力強化`,
        description: `${weapon.name}のダメージ ×1.30`,
        multiplierOrDelta: 1.3,
      },
      {
        id: `weapon_freq_${weapon.id}`,
        category: "weapon_stat",
        targetWeaponId: weapon.id,
        statType: "attack_freq",
        title: `${weapon.name}・連撃加速`,
        description: `${weapon.name}の攻撃間隔 ×0.85`,
        multiplierOrDelta: 0.85,
      },
    );
    if (weapon.baseDurationMs > 0) {
      options.push({
        id: `weapon_dur_${weapon.id}`,
        category: "weapon_stat",
        targetWeaponId: weapon.id,
        statType: "duration",
        title: `${weapon.name}・持続延長`,
        description: `${weapon.name}の持続時間 ×1.25`,
        multiplierOrDelta: 1.25,
      });
    }
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
      description: `${weapon.name}をバトル中スキルに追加`,
      multiplierOrDelta: 1,
    }));
};
