import { WEAPON_MASTER_MAP, WEAPON_MASTERS } from "@/data";
import {
  applyUpgradeOption,
  createDefaultWeaponModifier,
  generateUpgradeChoices,
} from "@/domain";
import type {
  InGameBuffState,
  InGameUpgradeOption,
  WeaponId,
  WeaponModifierState,
} from "@/types";
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

describe("domain/battle-upgrade", () => {
  it("generates 3 unique upgrade choices including weapon_unlock when under 3 active weapons", () => {
    const buff = createBaseBuffState(["sword_hamon"]);
    const choices = generateUpgradeChoices({
      buffState: buff,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      rng: () => 0.99,
    });

    expect(choices).toHaveLength(3);
    const uniqueIds = new Set(choices.map((c) => c.id));
    expect(uniqueIds.size).toBe(3);
  });

  it("excludes weapon_unlock options when 3 active weapons are already unlocked", () => {
    const buff = createBaseBuffState([
      "sword_hamon",
      "bow_azusa",
      "shuriken_kaze",
    ]);
    const choices = generateUpgradeChoices({
      buffState: buff,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      choiceCount: 20,
      rng: () => 0.5,
    });

    expect(choices.length).toBeGreaterThan(0);
    expect(choices.some((c) => c.category === "weapon_unlock")).toBe(false);
  });

  it("excludes unowned weapons from weapon_unlock options when ownedWeaponIds is provided", () => {
    const buff = createBaseBuffState(["sword_hamon"]);
    const onlyInitialChoices = generateUpgradeChoices({
      buffState: buff,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      ownedWeaponIds: ["sword_hamon"],
      choiceCount: 20,
      rng: () => 0.5,
    });
    expect(onlyInitialChoices.some((c) => c.category === "weapon_unlock")).toBe(
      false,
    );

    const twoOwnedChoices = generateUpgradeChoices({
      buffState: buff,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      ownedWeaponIds: ["sword_hamon", "bow_azusa"],
      choiceCount: 20,
      rng: () => 0.5,
    });
    const unlockOptions = twoOwnedChoices.filter(
      (c) => c.category === "weapon_unlock",
    );
    expect(unlockOptions).toHaveLength(1);
    expect(unlockOptions[0].targetWeaponId).toBe("bow_azusa");
  });

  it("applies base_stat upgrades multiplicatively for atk_pct and crit_dmg", () => {
    const atkOption: InGameUpgradeOption = {
      id: "base_atk_pct",
      category: "base_stat",
      statType: "atk_pct",
      title: "霊力増幅",
      description: "全攻撃力 ×1.25",
      multiplierOrDelta: 1.25,
    };
    const critDmgOption: InGameUpgradeOption = {
      id: "base_crit_dmg",
      category: "base_stat",
      statType: "crit_dmg",
      title: "会心極意",
      description: "会心ダメージ倍率 ×1.25",
      multiplierOrDelta: 1.25,
    };

    const first = applyUpgradeOption(
      createBaseBuffState(),
      atkOption,
      WEAPON_MASTER_MAP,
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = applyUpgradeOption(first.data, atkOption, WEAPON_MASTER_MAP);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.data.atkMultiplier).toBeCloseTo(1.5625, 6);

    const third = applyUpgradeOption(
      second.data,
      critDmgOption,
      WEAPON_MASTER_MAP,
    );
    expect(third.ok).toBe(true);
    if (third.ok) {
      expect(third.data.critDamageMultiplier).toBeCloseTo(1.875, 6);
    }
  });

  it("unlocks a new weapon up to 3 slots and rejects 4th weapon_unlock", () => {
    const unlockBow: InGameUpgradeOption = {
      id: "weapon_unlock_bow_azusa",
      category: "weapon_unlock",
      targetWeaponId: "bow_azusa",
      title: "新武器開放：破魔の梓弓",
      description: "追加",
      multiplierOrDelta: 1,
    };

    const unlocked = applyUpgradeOption(
      createBaseBuffState(["sword_hamon"]),
      unlockBow,
      WEAPON_MASTER_MAP,
    );
    expect(unlocked.ok).toBe(true);
    if (unlocked.ok) {
      expect(unlocked.data.unlockedWeaponIds).toEqual([
        "sword_hamon",
        "bow_azusa",
      ]);
      expect(unlocked.data.weaponModifiers.bow_azusa).toEqual(
        createDefaultWeaponModifier(),
      );
    }

    const fullBuff = createBaseBuffState([
      "sword_hamon",
      "shuriken_kaze",
      "mirror_yata",
    ]);
    const rejected = applyUpgradeOption(fullBuff, unlockBow, WEAPON_MASTER_MAP);
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.error.code).toBe("ALREADY_MAX_LEVEL");
    }
  });

  it("omits base_range_pct, uses +{pct}% descriptions, and unlocks sword slash upgrades only after sword_slash_unlock", () => {
    const initial = createBaseBuffState(["sword_hamon"]);

    // 斬撃発生前は斬撃サイズ・貫通オプションが候補に出ず、斬撃発生と攻撃範囲拡大が出る（base_range_pctは廃止）
    const prePool = generateUpgradeChoices({
      buffState: initial,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      ownedWeaponIds: ["sword_hamon"],
      choiceCount: 30,
    });
    expect(prePool.some((c) => c.id === "base_range_pct")).toBe(false);
    expect(prePool.some((c) => c.id === "weapon_dur_sword_hamon")).toBe(false);
    expect(prePool.find((c) => c.id === "base_atk_pct")?.description).toBe(
      "全攻撃力 +25%",
    );
    expect(
      prePool.find((c) => c.id === "weapon_freq_sword_hamon")?.description,
    ).toBe("攻撃頻度 +15%");
    expect(prePool.some((c) => c.id === "weapon_range_sword_hamon")).toBe(true);
    expect(prePool.some((c) => c.id === "sword_slash_unlock_sword_hamon")).toBe(
      true,
    );
    expect(prePool.some((c) => c.id === "sword_slash_size_sword_hamon")).toBe(
      false,
    );

    const swordRangeOpt = prePool.find(
      (c) => c.id === "weapon_range_sword_hamon",
    );
    const unlockSlashOpt = prePool.find(
      (c) => c.id === "sword_slash_unlock_sword_hamon",
    );
    expect(swordRangeOpt && unlockSlashOpt).toBeTruthy();
    if (!swordRangeOpt || !unlockSlashOpt) return;

    const afterSwordRange = applyUpgradeOption(
      initial,
      swordRangeOpt,
      WEAPON_MASTER_MAP,
    );
    expect(afterSwordRange.ok).toBe(true);
    if (!afterSwordRange.ok) return;
    expect(
      afterSwordRange.data.weaponModifiers.sword_hamon.rangeMultiplier,
    ).toBeCloseTo(1.25, 6);

    const afterSlashUnlock = applyUpgradeOption(
      afterSwordRange.data,
      unlockSlashOpt,
      WEAPON_MASTER_MAP,
    );
    expect(afterSlashUnlock.ok).toBe(true);
    if (!afterSlashUnlock.ok) return;
    expect(
      afterSlashUnlock.data.weaponModifiers.sword_hamon.slashWaveEnabled,
    ).toBe(true);

    // 斬撃発生後は斬撃サイズ・貫通+1/+2が候補に出現し、斬撃発生自体は出なくなる
    const postPool = generateUpgradeChoices({
      buffState: afterSlashUnlock.data,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      ownedWeaponIds: ["sword_hamon"],
      choiceCount: 30,
    });
    expect(
      postPool.some((c) => c.id === "sword_slash_unlock_sword_hamon"),
    ).toBe(false);
    const sizeOpt = postPool.find(
      (c) => c.id === "sword_slash_size_sword_hamon",
    );
    const p1Opt = postPool.find(
      (c) => c.id === "sword_slash_pierce_1_sword_hamon",
    );
    const p2Opt = postPool.find(
      (c) => c.id === "sword_slash_pierce_2_sword_hamon",
    );
    expect(sizeOpt && p1Opt && p2Opt).toBeTruthy();
    if (!sizeOpt || !p1Opt || !p2Opt) return;

    const afterSize = applyUpgradeOption(
      afterSlashUnlock.data,
      sizeOpt,
      WEAPON_MASTER_MAP,
    );
    expect(afterSize.ok).toBe(true);
    if (!afterSize.ok) return;
    const afterP1 = applyUpgradeOption(
      afterSize.data,
      p1Opt,
      WEAPON_MASTER_MAP,
    );
    expect(afterP1.ok).toBe(true);
    if (!afterP1.ok) return;
    const afterP2 = applyUpgradeOption(afterP1.data, p2Opt, WEAPON_MASTER_MAP);
    expect(afterP2.ok).toBe(true);
    if (!afterP2.ok) return;

    const finalMod = afterP2.data.weaponModifiers.sword_hamon;
    expect(finalMod.slashWaveSizeMultiplier).toBeCloseTo(1.3, 6);
    expect(finalMod.slashWavePierceBonus).toBe(3);
  });

  it("uses updated unlock description '{武器名}を獲得' and weights weapon_unlock > minor > major", () => {
    const initial = createBaseBuffState(["bow_azusa"]);
    const allChoices = generateUpgradeChoices({
      buffState: initial,
      weaponMap: WEAPON_MASTER_MAP,
      allWeapons: WEAPON_MASTERS,
      ownedWeaponIds: ["bow_azusa", "sword_hamon"],
      choiceCount: 50,
    });
    const unlockChoice = allChoices.find(
      (c) => c.id === "weapon_unlock_sword_hamon",
    );
    expect(unlockChoice?.description).toBe("銘刀・波紋を獲得");

    // 決定論的RNGで先頭出現頻度を比較: weapon_unlock(10) > minor(5) > major(2)
    let unlockFirst = 0;
    let minorFirst = 0;
    let majorFirst = 0;
    const samples = 200;
    for (let i = 0; i < samples; i += 1) {
      const r = i / samples;
      const picked = generateUpgradeChoices({
        buffState: initial,
        weaponMap: WEAPON_MASTER_MAP,
        allWeapons: WEAPON_MASTERS,
        ownedWeaponIds: ["bow_azusa", "sword_hamon"],
        choiceCount: 1,
        rng: () => r,
      })[0];
      if (picked.category === "weapon_unlock") {
        unlockFirst += 1;
      } else if (
        picked.statType === "split_unlock" ||
        picked.statType === "projectile_plus_2" ||
        picked.statType === "pierce_plus_2" ||
        picked.statType === "bounce_plus_2" ||
        picked.statType === "explosion_unlock"
      ) {
        majorFirst += 1;
      } else {
        minorFirst += 1;
      }
    }
    expect(unlockFirst).toBeGreaterThan(0);
    expect(minorFirst).toBeGreaterThan(majorFirst);
  });
});
