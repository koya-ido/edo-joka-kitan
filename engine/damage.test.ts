import { CHARACTER_MASTER_MAP, WEAPON_MASTER_MAP } from "@/data";
import {
  calculateEffectiveCooldownMs,
  calculateWeaponDamage,
  resolveCharacterPassive,
} from "@/engine";
import type { InGameBuffState } from "@/types";
import { describe, expect, it } from "vitest";

const baseBuffState = (): InGameBuffState => ({
  atkMultiplier: 1,
  critRateBonusPct: 0,
  critDamageMultiplier: 1.5,
  unlockedWeaponIds: ["sword_hamon"],
  weaponModifiers: {
    sword_hamon: {
      damageMultiplier: 1,
      cooldownMultiplier: 1,
      durationMultiplier: 1,
    },
  },
});

describe("engine/damage (passives, multiplicative buffs, crit math)", () => {
  it("resolves all 3 character passive skill types accurately", () => {
    const onmyoji = resolveCharacterPassive(
      CHARACTER_MASTER_MAP.apprentice_onmyoji,
      2,
    );
    expect(onmyoji.barrierRegenPerSec).toBe(2.5);
    expect(onmyoji.expMultiplier).toBe(1);

    const miko = resolveCharacterPassive(
      CHARACTER_MASTER_MAP.white_fox_miko,
      2,
    );
    expect(miko.critRateBonusPct).toBe(16);
    expect(miko.expMultiplier).toBeCloseTo(1.16);

    const shinobi = resolveCharacterPassive(
      CHARACTER_MASTER_MAP.shadow_shinobi,
      2,
    );
    expect(shinobi.cooldownMultiplier).toBeCloseTo(1 / 1.16);
  });

  it("applies refine level, atk factor, multiplicative buffs, and crit multiplier", () => {
    const weapon = WEAPON_MASTER_MAP.sword_hamon;
    const buff = baseBuffState();
    buff.atkMultiplier = 2.25; // 1.5 * 1.5
    buff.weaponModifiers.sword_hamon.damageMultiplier = 1.2;

    const passive = resolveCharacterPassive(
      CHARACTER_MASTER_MAP.apprentice_onmyoji,
      0,
    );

    const nonCrit = calculateWeaponDamage(
      weapon,
      2,
      { hp: 120, atk: 20, luk: 10 },
      buff,
      passive,
      () => 0.99,
    );
    // (24 + 2*6) * (20/20) * 2.25 * 1.2 = 36 * 2.7 = 97.2 -> 97
    expect(nonCrit.isCrit).toBe(false);
    expect(nonCrit.damage).toBe(97);

    const crit = calculateWeaponDamage(
      weapon,
      2,
      { hp: 120, atk: 20, luk: 10 },
      buff,
      passive,
      () => 0.01,
    );
    // 97.2 * 1.5 = 145.8 -> 146
    expect(crit.isCrit).toBe(true);
    expect(crit.damage).toBe(146);
  });

  it("reduces weapon cooldown with attack_speed_boost passive", () => {
    const weapon = WEAPON_MASTER_MAP.sword_hamon;
    const buff = baseBuffState();
    const shinobi = resolveCharacterPassive(
      CHARACTER_MASTER_MAP.shadow_shinobi,
      0,
    );

    const cd = calculateEffectiveCooldownMs(weapon, buff, shinobi);
    // 1100 / 1.1 = 1000
    expect(cd).toBe(1000);
  });
});
