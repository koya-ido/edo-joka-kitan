import { WEAPON_UPGRADE_CAPS } from "@/domain/battle-upgrade-caps";
import {
  buildBounceOpts,
  buildDebuffOpts,
  buildPierceOpts,
  buildProjectileCountOpts,
  buildSplitOpts,
  buildUniqueExplosionOpts,
  makeWeaponStatOpt,
} from "@/domain/battle-upgrade-shared-opts";
import { buildSwordOptions } from "@/domain/battle-upgrade-sword-pool";
import type {
  InGameUpgradeOption,
  WeaponGenre,
  WeaponMaster,
  WeaponModifierState,
} from "@/types";

const buildBallisticOpts = (
  weapon: WeaponMaster,
  mod: WeaponModifierState | undefined,
): readonly InGameUpgradeOption[] => [
  ...buildProjectileCountOpts(weapon, mod, "連射数"),
  ...buildPierceOpts(weapon, mod),
  ...buildBounceOpts(weapon, mod),
  ...buildSplitOpts(weapon, mod),
  ...buildUniqueExplosionOpts(weapon, mod),
];

const buildShurikenOpts = (
  weapon: WeaponMaster,
  mod: WeaponModifierState | undefined,
): readonly InGameUpgradeOption[] => [
  ...buildProjectileCountOpts(
    weapon,
    mod,
    "同時射出数",
    WEAPON_UPGRADE_CAPS.maxShurikenExtraProjectiles,
  ),
  ...buildPierceOpts(weapon, mod),
  ...buildBounceOpts(weapon, mod),
  ...buildSplitOpts(weapon, mod),
  ...buildUniqueExplosionOpts(weapon, mod),
];

const buildMirrorOpts = (
  weapon: WeaponMaster,
  mod?: WeaponModifierState,
): readonly InGameUpgradeOption[] => [
  ...buildProjectileCountOpts(weapon, mod, "光線数"),
  ...buildBounceOpts(weapon, mod, "光線反射"),
  ...((mod?.durationMultiplier ?? 1) < WEAPON_UPGRADE_CAPS.maxDurationMultiplier
    ? [
        makeWeaponStatOpt(
          weapon,
          "duration",
          "weapon_dur",
          "持続延長",
          "持続時間 +25%",
          1.25,
        ),
      ]
    : []),
  ...buildUniqueExplosionOpts(weapon, mod),
];

const buildTalismanOpts = (
  weapon: WeaponMaster,
  mod?: WeaponModifierState,
): readonly InGameUpgradeOption[] => {
  const curChain = mod?.chainBonus ?? 0;
  const chainOpts: InGameUpgradeOption[] = [];
  if (curChain < WEAPON_UPGRADE_CAPS.maxTalismanChainBonus) {
    chainOpts.push(
      makeWeaponStatOpt(
        weapon,
        "talisman_chain_plus_1",
        "talisman_chain_plus_1",
        "連鎖数+1",
        "連鎖ターゲット数 +1",
        1,
      ),
    );
  }
  if (curChain + 2 <= WEAPON_UPGRADE_CAPS.maxTalismanChainBonus) {
    chainOpts.push(
      makeWeaponStatOpt(
        weapon,
        "talisman_chain_plus_2",
        "talisman_chain_plus_2",
        "連鎖数+2",
        "連鎖ターゲット数 +2",
        2,
      ),
    );
  }
  return [
    ...buildProjectileCountOpts(weapon, mod, "ターゲット数"),
    ...chainOpts,
    ...buildDebuffOpts(weapon, mod),
  ];
};

const buildFanOpts = (
  weapon: WeaponMaster,
  mod?: WeaponModifierState,
): readonly InGameUpgradeOption[] => [
  ...((mod?.knockbackMultiplier ?? 1) <
  WEAPON_UPGRADE_CAPS.maxKnockbackMultiplier
    ? [
        makeWeaponStatOpt(
          weapon,
          "fan_knockback_pct",
          "fan_knockback_pct",
          "ノックバック強化",
          "ノックバック距離 +30%",
          1.3,
        ),
      ]
    : []),
  ...(weapon.uniqueSkills?.includes("debuff")
    ? buildDebuffOpts(weapon, mod)
    : []),
];

const buildOrbOpts = (
  weapon: WeaponMaster,
  mod?: WeaponModifierState,
): readonly InGameUpgradeOption[] => [
  ...buildProjectileCountOpts(weapon, mod, "霊珠数"),
  ...(weapon.uniqueSkills?.includes("debuff")
    ? buildDebuffOpts(weapon, mod)
    : []),
];

type GenreOptionBuilder = (
  weapon: WeaponMaster,
  modifier?: WeaponModifierState,
) => readonly InGameUpgradeOption[];

/** WeaponGenre ごとの固有強化項目定義 */
export const GENRE_UPGRADE_BUILDERS: Readonly<
  Record<WeaponGenre, GenreOptionBuilder>
> = {
  bow: buildBallisticOpts,
  sword: buildSwordOptions,
  shuriken: buildShurikenOpts,
  mirror: buildMirrorOpts,
  talisman: buildTalismanOpts,
  matchlock: buildBallisticOpts,
  fan: buildFanOpts,
  orb: buildOrbOpts,
};

/** 武器ジャンル固有のレベルアップ候補を生成する */
export const buildGenreSpecificOptions = (
  weapon: WeaponMaster,
  modifier?: WeaponModifierState,
): readonly InGameUpgradeOption[] =>
  GENRE_UPGRADE_BUILDERS[weapon.genre](weapon, modifier);
