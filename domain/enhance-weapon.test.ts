import { WEAPON_MASTER_MAP } from "@/data";
import {
  applyWeaponRefine,
  calculateWeaponRefineCost,
  createInitialPlayerSave,
  guardWeaponRefineable,
} from "@/domain";
import { describe, expect, it } from "vitest";

describe("domain/enhance-weapon (weapon refine cost, guards & application)", () => {
  it("calculates refine cost starting at 30 and stepping by 20 per level", () => {
    expect(calculateWeaponRefineCost(0)).toBe(30);
    expect(calculateWeaponRefineCost(1)).toBe(50);
    expect(calculateWeaponRefineCost(2)).toBe(70);
    expect(calculateWeaponRefineCost(3)).toBe(90);
    expect(calculateWeaponRefineCost(4)).toBe(110);
  });

  it("refines owned weapon, deducts magatama, and keeps initial save immutable", () => {
    const base = createInitialPlayerSave(new Date("2026-11-14T00:00:00.000Z"));
    const save = {
      ...base,
      currencies: { ...base.currencies, magatama: 100 },
    };

    const res = applyWeaponRefine(
      save,
      "sword_hamon",
      WEAPON_MASTER_MAP,
      new Date("2026-11-14T01:00:00.000Z"),
    );

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.ownedWeapons.sword_hamon.refineLevel).toBe(1);
      expect(res.data.currencies.magatama).toBe(70);
      expect(res.data.updatedAt).toBe("2026-11-14T01:00:00.000Z");
    }
    expect(save.ownedWeapons.sword_hamon.refineLevel).toBe(0);
    expect(save.currencies.magatama).toBe(100);
  });

  it("403-equivalent: rejects unowned weapon refine", () => {
    const base = createInitialPlayerSave();
    const save = {
      ...base,
      currencies: { ...base.currencies, magatama: 500 },
    };

    const res = guardWeaponRefineable(save, "bow_azusa", WEAPON_MASTER_MAP);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("UNOWNED_WEAPON");
    }
  });

  it("403-equivalent: rejects refine when weapon is already at maxRefineLevel", () => {
    const base = createInitialPlayerSave();
    const save = {
      ...base,
      currencies: { ...base.currencies, magatama: 500 },
      ownedWeapons: {
        ...base.ownedWeapons,
        sword_hamon: {
          ...base.ownedWeapons.sword_hamon,
          refineLevel: WEAPON_MASTER_MAP.sword_hamon.maxRefineLevel,
        },
      },
    };

    const res = applyWeaponRefine(save, "sword_hamon", WEAPON_MASTER_MAP);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("ALREADY_MAX_LEVEL");
    }
  });

  it("403-equivalent: rejects refine when magatama is insufficient", () => {
    const base = createInitialPlayerSave();
    const save = {
      ...base,
      currencies: { ...base.currencies, magatama: 29 },
    };

    const res = applyWeaponRefine(save, "sword_hamon", WEAPON_MASTER_MAP);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("INSUFFICIENT_MAGATAMA");
    }
  });

  it("rejects unknown or empty weaponId", () => {
    const save = createInitialPlayerSave();

    const res = guardWeaponRefineable(
      save,
      "unknown_weapon",
      WEAPON_MASTER_MAP,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("SAVE_CORRUPTED");
    }
  });
});
