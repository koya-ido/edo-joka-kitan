import { WEAPON_UPGRADE_CAPS } from "@/domain/battle-upgrade-caps";
import {
  buildUniqueExplosionOpts,
  makeWeaponStatOpt,
} from "@/domain/battle-upgrade-shared-opts";
import type {
  InGameUpgradeOption,
  WeaponMaster,
  WeaponModifierState,
} from "@/types";

export const MAX_SWORD_COMBO_BONUS = WEAPON_UPGRADE_CAPS.maxSwordComboBonus;

export const buildSwordOptions = (
  weapon: WeaponMaster,
  modifier?: WeaponModifierState,
): readonly InGameUpgradeOption[] => {
  const swordOpts: InGameUpgradeOption[] = [];

  const currentCombo = modifier?.comboBonus ?? 0;
  if (currentCombo < MAX_SWORD_COMBO_BONUS) {
    swordOpts.push(
      makeWeaponStatOpt(
        weapon,
        "sword_combo_1",
        "sword_combo_1",
        "連撃追加+1",
        "連続斬撃 +1 / 威力 -15%",
        1,
      ),
    );
  }
  if (currentCombo + 2 <= MAX_SWORD_COMBO_BONUS) {
    swordOpts.push(
      makeWeaponStatOpt(
        weapon,
        "sword_combo_2",
        "sword_combo_2",
        "連撃追加+2",
        "連続斬撃 +2 / 威力 -25%",
        2,
      ),
    );
  }

  if (!modifier?.slashWaveEnabled) {
    swordOpts.push(
      makeWeaponStatOpt(
        weapon,
        "sword_slash_unlock",
        "sword_slash_unlock",
        "斬撃発生",
        "攻撃時に飛ぶ斬撃波を発生",
        1,
      ),
    );
  } else {
    if (
      modifier.slashWaveSizeMultiplier <
      WEAPON_UPGRADE_CAPS.maxSlashWaveSizeMultiplier
    ) {
      swordOpts.push(
        makeWeaponStatOpt(
          weapon,
          "sword_slash_size",
          "sword_slash_size",
          "斬撃サイズ拡大",
          "斬撃波サイズ +30%",
          1.3,
        ),
      );
    }
    if (
      modifier.slashWavePierceBonus <
      WEAPON_UPGRADE_CAPS.maxSlashWavePierceBonus
    ) {
      swordOpts.push(
        makeWeaponStatOpt(
          weapon,
          "sword_slash_pierce_1",
          "sword_slash_pierce_1",
          "斬撃貫通+1",
          "斬撃波の貫通数 +1 / 威力 -10%",
          1,
        ),
      );
    }
    if (
      modifier.slashWavePierceBonus + 2 <=
      WEAPON_UPGRADE_CAPS.maxSlashWavePierceBonus
    ) {
      swordOpts.push(
        makeWeaponStatOpt(
          weapon,
          "sword_slash_pierce_2",
          "sword_slash_pierce_2",
          "斬撃貫通+2",
          "斬撃波の貫通数 +2 / 威力 -20%",
          2,
        ),
      );
    }
  }

  swordOpts.push(...buildUniqueExplosionOpts(weapon, modifier));
  return swordOpts;
};
