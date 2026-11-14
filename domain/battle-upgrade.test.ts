import { WEAPON_MASTER_MAP, WEAPON_MASTERS } from "@/data";
import { applyUpgradeOption, generateUpgradeChoices } from "@/domain";
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
    unlockedWeaponIds.map((id) => [
      id,
      { damageMultiplier: 1, cooldownMultiplier: 1, durationMultiplier: 1 },
    ]),
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
      expect(unlocked.data.weaponModifiers.bow_azusa).toEqual({
        damageMultiplier: 1,
        cooldownMultiplier: 1,
        durationMultiplier: 1,
      });
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
});
