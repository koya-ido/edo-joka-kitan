import { CHARACTER_MASTERS, GACHA_CONFIG, WEAPON_MASTERS } from "@/data";
import {
  createInitialPlayerSave,
  getGachaCost,
  getGachaDropRates,
  guardGachaPullable,
  resolveGachaPulls,
} from "@/domain";
import { describe, expect, it } from "vitest";

const FIXED_NOW = new Date("2026-11-14T06:00:00.000Z");

const createSequenceRng = (rolls: readonly number[]): (() => number) => {
  let index = 0;
  return () => {
    const value = rolls[index % rolls.length] ?? 0;
    index += 1;
    return value;
  };
};

describe("domain/gacha (Slice 3 gacha pull, awakening/refine, conversion & 403 guards)", () => {
  it("calculates single and 10-pull costs from GACHA_CONFIG", () => {
    expect(getGachaCost(1)).toBe(GACHA_CONFIG.singleCostHisui);
    expect(getGachaCost(10)).toBe(GACHA_CONFIG.multiCostHisui);
  });

  it("computes drop rates matching character and weapon master pools", () => {
    const charRates = getGachaDropRates("character");
    const weaponRates = getGachaDropRates("weapon");
    expect(charRates).toHaveLength(CHARACTER_MASTERS.length);
    expect(weaponRates).toHaveLength(WEAPON_MASTERS.length);
    expect(charRates[0]?.ratePercent).toBeGreaterThan(0);
  });

  it("grants a new character at awakeningLevel 0 and deducts 5 hisui", () => {
    const save = createInitialPlayerSave(FIXED_NOW);
    // index 1 -> white_fox_miko (3 chars -> 0.4 falls into index 1)
    const result = resolveGachaPulls(
      save,
      "character",
      1,
      () => 0.4,
      FIXED_NOW,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.spentHisui).toBe(5);
      expect(result.data.totalConvertedMagatama).toBe(0);
      expect(result.data.nextSave.currencies).toEqual({
        magatama: 100,
        hisui: 0,
      });
      expect(
        result.data.nextSave.ownedCharacters.white_fox_miko.awakeningLevel,
      ).toBe(0);
      expect(result.data.items).toEqual([
        {
          poolType: "character",
          targetId: "white_fox_miko",
          name: "白狐の巫女・稲荷",
          outcome: "new",
          previousLevel: null,
          nextLevel: 0,
          convertedMagatama: 0,
        },
      ]);
    }
  });

  it("auto-awakens owned character without spending magatama", () => {
    const save = createInitialPlayerSave(FIXED_NOW);
    // index 0 -> apprentice_onmyoji (already owned at Lv.0)
    const result = resolveGachaPulls(
      save,
      "character",
      1,
      () => 0.0,
      FIXED_NOW,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.nextSave.currencies).toEqual({
        magatama: 100,
        hisui: 0,
      });
      expect(
        result.data.nextSave.ownedCharacters.apprentice_onmyoji.awakeningLevel,
      ).toBe(1);
      expect(result.data.items[0]?.outcome).toBe("awakening_or_refine");
      expect(result.data.items[0]?.previousLevel).toBe(0);
      expect(result.data.items[0]?.nextLevel).toBe(1);
    }
  });

  it("handles 10-pull progressive transitions (new -> refine -> max conversion)", () => {
    const base = createInitialPlayerSave(FIXED_NOW);
    const save = {
      ...base,
      currencies: { magatama: 100, hisui: 60 },
    };
    // 10 pulls of bow_azusa (index 1):
    // #1: new(0), #2..#6: refine 1..5 (5 draws), #7..#10: converted x4 (+50 each = +200)
    const result = resolveGachaPulls(
      save,
      "weapon",
      10,
      createSequenceRng([1.5 / WEAPON_MASTERS.length]),
      FIXED_NOW,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.spentHisui).toBe(50);
      expect(result.data.totalConvertedMagatama).toBe(200);
      expect(result.data.nextSave.currencies).toEqual({
        magatama: 300,
        hisui: 10,
      });
      expect(result.data.nextSave.ownedWeapons.bow_azusa.refineLevel).toBe(5);
      expect(result.data.items[0]?.outcome).toBe("new");
      expect(result.data.items[5]?.outcome).toBe("awakening_or_refine");
      expect(result.data.items[5]?.nextLevel).toBe(5);
      expect(result.data.items[6]?.outcome).toBe("converted_to_magatama");
      expect(result.data.items[6]?.convertedMagatama).toBe(50);
    }
  });

  it("rejects single and 10-pull when hisui is insufficient (403 guard)", () => {
    const base = createInitialPlayerSave(FIXED_NOW);
    const poorSave = { ...base, currencies: { magatama: 100, hisui: 4 } };
    const singleDenied = resolveGachaPulls(
      poorSave,
      "character",
      1,
      () => 0.1,
      FIXED_NOW,
    );
    expect(singleDenied.ok).toBe(false);
    if (!singleDenied.ok) {
      expect(singleDenied.error.code).toBe("INSUFFICIENT_HISUI");
    }
    expect(poorSave.currencies.hisui).toBe(4);

    const multiShortSave = {
      ...base,
      currencies: { magatama: 100, hisui: 49 },
    };
    const multiDenied = guardGachaPullable(multiShortSave, "weapon", 10);
    expect(multiDenied.ok).toBe(false);
    if (!multiDenied.ok) {
      expect(multiDenied.error.code).toBe("INSUFFICIENT_HISUI");
    }
  });

  it("rejects invalid poolType or pull count (403/400 guard)", () => {
    const save = createInitialPlayerSave(FIXED_NOW);
    const badPool = guardGachaPullable(save, "invalid" as "character", 1);
    expect(badPool.ok).toBe(false);
    if (!badPool.ok) {
      expect(badPool.error.code).toBe("SAVE_CORRUPTED");
    }

    const badCount = guardGachaPullable(save, "character", 5 as 1);
    expect(badCount.ok).toBe(false);
    if (!badCount.ok) {
      expect(badCount.error.code).toBe("SAVE_CORRUPTED");
    }
  });
});
