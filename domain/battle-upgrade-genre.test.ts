import { WEAPON_MASTER_MAP, WEAPON_MASTERS } from "@/data";
import {
  applyUpgradeOption,
  createDefaultWeaponModifier,
  generateUpgradeChoices,
} from "@/domain";
import type { InGameBuffState, WeaponId, WeaponModifierState } from "@/types";
import { describe, expect, it } from "vitest";

const createBaseBuffState = (
  unlockedWeaponIds: WeaponId[] = ["sword_hamon"],
): InGameBuffState => ({
  atkMultiplier: 1,
  critRateBonusPct: 0,
  critDamageMultiplier: 1.5,
  unlockedWeaponIds,
  weaponModifiers: Object.fromEntries(
    unlockedWeaponIds.map((id) => [id, createDefaultWeaponModifier()]),
  ) as Record<WeaponId, WeaponModifierState>,
});

describe("domain/battle-upgrade (genre pools & caps)", () => {
  it("caps sword combo bonus at 2 (max 3 total slashes)", () => {
    const initial = createBaseBuffState(["sword_hamon"]);
    const pool = generateUpgradeChoices({
      buffState: initial,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      ownedWeaponIds: ["sword_hamon"],
      choiceCount: 30,
    });
    const combo1 = pool.find((c) => c.id === "sword_combo_1_sword_hamon");
    const combo2 = pool.find((c) => c.id === "sword_combo_2_sword_hamon");
    expect(combo1 && combo2).toBeTruthy();
    if (!combo1 || !combo2) return;

    const after1 = applyUpgradeOption(initial, combo1, WEAPON_MASTER_MAP);
    expect(after1.ok).toBe(true);
    if (!after1.ok) return;
    expect(after1.data.weaponModifiers.sword_hamon.comboBonus).toBe(1);
    expect(
      after1.data.weaponModifiers.sword_hamon.damageMultiplier,
    ).toBeCloseTo(0.85, 6);

    const poolAtOne = generateUpgradeChoices({
      buffState: after1.data,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      ownedWeaponIds: ["sword_hamon"],
      choiceCount: 30,
    });
    expect(poolAtOne.some((c) => c.id === "sword_combo_1_sword_hamon")).toBe(
      true,
    );
    expect(poolAtOne.some((c) => c.id === "sword_combo_2_sword_hamon")).toBe(
      false,
    );

    const after1Again = applyUpgradeOption(
      after1.data,
      combo1,
      WEAPON_MASTER_MAP,
    );
    expect(after1Again.ok).toBe(true);
    if (!after1Again.ok) return;
    expect(after1Again.data.weaponModifiers.sword_hamon.comboBonus).toBe(2);
    expect(
      after1Again.data.weaponModifiers.sword_hamon.damageMultiplier,
    ).toBeCloseTo(0.85 * 0.85, 6);

    const cappedPool = generateUpgradeChoices({
      buffState: after1Again.data,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      ownedWeaponIds: ["sword_hamon"],
      choiceCount: 30,
    });
    expect(cappedPool.some((c) => c.id === "sword_combo_1_sword_hamon")).toBe(
      false,
    );
    expect(cappedPool.some((c) => c.id === "sword_combo_2_sword_hamon")).toBe(
      false,
    );
    const rejectedOverCap = applyUpgradeOption(
      after1Again.data,
      combo1,
      WEAPON_MASTER_MAP,
    );
    expect(rejectedOverCap.ok).toBe(false);
    if (!rejectedOverCap.ok) {
      expect(rejectedOverCap.error.code).toBe("ALREADY_MAX_LEVEL");
    }

    const afterCombo2 = applyUpgradeOption(initial, combo2, WEAPON_MASTER_MAP);
    expect(afterCombo2.ok).toBe(true);
    if (!afterCombo2.ok) return;
    expect(afterCombo2.data.weaponModifiers.sword_hamon.comboBonus).toBe(2);
    expect(
      afterCombo2.data.weaponModifiers.sword_hamon.damageMultiplier,
    ).toBeCloseTo(0.75, 6);
  });

  it("enforces per-WeaponGenre upgrade pools, uniqueSkills gating, and caps", () => {
    const buff = createBaseBuffState([
      "mirror_yata",
      "talisman_goou",
      "bow_azusa",
      "shuriken_kaze",
      "matchlock_tanegashima",
      "fan_tengu",
      "orb_magatama",
    ]);
    const pool = generateUpgradeChoices({
      buffState: buff,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      choiceCount: 100,
    });
    expect(pool.some((c) => c.id === "weapon_dur_mirror_yata")).toBe(true);
    expect(pool.some((c) => c.id === "projectile_plus_1_mirror_yata")).toBe(
      true,
    );
    expect(pool.some((c) => c.id === "bounce_plus_1_mirror_yata")).toBe(true);
    expect(pool.some((c) => c.id === "pierce_plus_1_mirror_yata")).toBe(false);

    expect(pool.some((c) => c.id === "weapon_dur_bow_azusa")).toBe(false);
    expect(pool.some((c) => c.id === "linger_50_bow_azusa")).toBe(false);
    expect(pool.some((c) => c.id === "explosion_unlock_bow_azusa")).toBe(false);
    expect(pool.some((c) => c.id === "projectile_plus_1_bow_azusa")).toBe(true);
    expect(pool.some((c) => c.id === "pierce_plus_1_bow_azusa")).toBe(true);
    expect(pool.some((c) => c.id === "bounce_plus_1_bow_azusa")).toBe(true);
    expect(pool.some((c) => c.id === "split_unlock_bow_azusa")).toBe(true);

    expect(pool.some((c) => c.id === "bounce_plus_1_shuriken_kaze")).toBe(true);
    expect(pool.some((c) => c.id === "pierce_plus_1_shuriken_kaze")).toBe(true);
    expect(pool.some((c) => c.id === "split_unlock_shuriken_kaze")).toBe(true);
    expect(pool.some((c) => c.id === "weapon_dur_shuriken_kaze")).toBe(false);

    expect(
      pool.some((c) => c.id === "explosion_unlock_matchlock_tanegashima"),
    ).toBe(false);
    expect(
      pool.some((c) => c.id === "explosion_radius_30_matchlock_tanegashima"),
    ).toBe(true);

    expect(pool.some((c) => c.id === "projectile_plus_1_talisman_goou")).toBe(
      true,
    );
    expect(
      pool.some((c) => c.id === "talisman_chain_plus_1_talisman_goou"),
    ).toBe(true);
    expect(pool.some((c) => c.id === "debuff_unlock_talisman_goou")).toBe(true);

    expect(pool.some((c) => c.id === "fan_knockback_pct_fan_tengu")).toBe(true);
    expect(pool.some((c) => c.id === "projectile_plus_1_orb_magatama")).toBe(
      true,
    );

    const splitOpt = pool.find((c) => c.id === "split_unlock_bow_azusa");
    expect(splitOpt).toBeDefined();
    if (!splitOpt) return;
    const afterSplit = applyUpgradeOption(buff, splitOpt, WEAPON_MASTER_MAP);
    expect(afterSplit.ok).toBe(true);
    if (!afterSplit.ok) return;
    const postSplitPool = generateUpgradeChoices({
      buffState: afterSplit.data,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      choiceCount: 100,
    });
    expect(
      postSplitPool.some((c) => c.id === "split_pierce_plus_1_bow_azusa"),
    ).toBe(true);
    expect(
      postSplitPool.some((c) => c.id === "split_bounce_plus_1_bow_azusa"),
    ).toBe(true);
  });

  it("prevents duplicate acquisition of feature-unlock skills (split, debuff, sword_slash) and offers radius directly for native explosion", () => {
    const initial = createBaseBuffState([
      "talisman_goou",
      "matchlock_tanegashima",
    ]);
    const prePool = generateUpgradeChoices({
      buffState: initial,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      choiceCount: 80,
    });
    expect(
      prePool.some((c) => c.id === "explosion_unlock_matchlock_tanegashima"),
    ).toBe(false);
    expect(
      prePool.some((c) => c.id === "explosion_radius_30_matchlock_tanegashima"),
    ).toBe(true);

    const debuffOpt = prePool.find(
      (c) => c.id === "debuff_unlock_talisman_goou",
    );
    expect(debuffOpt).toBeDefined();
    if (!debuffOpt) return;

    const afterDebuff = applyUpgradeOption(
      initial,
      debuffOpt,
      WEAPON_MASTER_MAP,
    );
    expect(afterDebuff.ok).toBe(true);
    if (!afterDebuff.ok) return;

    const postPool = generateUpgradeChoices({
      buffState: afterDebuff.data,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      choiceCount: 80,
    });
    expect(postPool.some((c) => c.id === "debuff_unlock_talisman_goou")).toBe(
      false,
    );

    const dupRejected = applyUpgradeOption(
      afterDebuff.data,
      debuffOpt,
      WEAPON_MASTER_MAP,
    );
    expect(dupRejected.ok).toBe(false);
    if (!dupRejected.ok) {
      expect(dupRejected.error.code).toBe("ALREADY_MAX_LEVEL");
    }
  });

  it("reduces damageMultiplier when applying projectile count or pierce upgrades", () => {
    const buff = createBaseBuffState(["bow_azusa", "sword_hamon"]);
    const bowPool = generateUpgradeChoices({
      buffState: buff,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      choiceCount: 100,
    });

    const checks: readonly [string, "bow_azusa" | "sword_hamon", number][] = [
      ["projectile_plus_1_bow_azusa", "bow_azusa", 0.85],
      ["projectile_plus_2_bow_azusa", "bow_azusa", 0.75],
      ["pierce_plus_1_bow_azusa", "bow_azusa", 0.9],
      ["pierce_plus_2_bow_azusa", "bow_azusa", 0.8],
    ];
    for (const [optId, weaponId, expectedMult] of checks) {
      const opt = bowPool.find((c) => c.id === optId);
      expect(opt).toBeDefined();
      if (!opt) continue;
      const res = applyUpgradeOption(buff, opt, WEAPON_MASTER_MAP);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.weaponModifiers[weaponId].damageMultiplier).toBeCloseTo(
          expectedMult,
          6,
        );
      }
    }

    // 斬撃波の貫通（sword_slash_pierce_1）も威力倍率が減少すること
    const slashUnlock = bowPool.find(
      (c) => c.id === "sword_slash_unlock_sword_hamon",
    );
    expect(slashUnlock).toBeDefined();
    if (!slashUnlock) return;
    const unlocked = applyUpgradeOption(buff, slashUnlock, WEAPON_MASTER_MAP);
    expect(unlocked.ok).toBe(true);
    if (!unlocked.ok) return;
    const swordPool = generateUpgradeChoices({
      buffState: unlocked.data,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      choiceCount: 100,
    });
    const slashPierce1 = swordPool.find(
      (c) => c.id === "sword_slash_pierce_1_sword_hamon",
    );
    expect(slashPierce1).toBeDefined();
    if (!slashPierce1) return;
    const afterSlashPierce = applyUpgradeOption(
      unlocked.data,
      slashPierce1,
      WEAPON_MASTER_MAP,
    );
    expect(afterSlashPierce.ok).toBe(true);
    if (afterSlashPierce.ok) {
      expect(
        afterSlashPierce.data.weaponModifiers.sword_hamon.damageMultiplier,
      ).toBeCloseTo(0.9, 6);
    }
  });
});
