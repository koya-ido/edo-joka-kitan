import { createInitialPlayerSave } from "@/domain/save-factory";
import { validatePlayerSaveData } from "@/domain/save-validator";
import { describe, expect, it } from "vitest";

describe("validatePlayerSaveData", () => {
  it("accepts a valid initial player save", () => {
    const save = createInitialPlayerSave(new Date("2026-11-14T00:00:00.000Z"));
    const result = validatePlayerSaveData(save);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.equippedCharacterId).toBe("apprentice_onmyoji");
      expect(Object.keys(result.data.ownedWeapons)).toEqual(["sword_hamon"]);
      expect(result.data.currencies).toEqual({ magatama: 100, hisui: 5 });
    }
  });

  it("rejects negative or non-integer currency with SAVE_CORRUPTED", () => {
    const base = createInitialPlayerSave();
    const negativeMagatama = {
      ...base,
      currencies: { ...base.currencies, magatama: -1 },
    };
    const floatHisui = {
      ...base,
      currencies: { ...base.currencies, hisui: 1.5 },
    };

    const r1 = validatePlayerSaveData(negativeMagatama);
    const r2 = validatePlayerSaveData(floatHisui);

    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.error.code).toBe("SAVE_CORRUPTED");
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error.code).toBe("SAVE_CORRUPTED");
  });

  it("rejects unknown/unowned character or empty ownedWeapons with SAVE_CORRUPTED", () => {
    const base = createInitialPlayerSave();
    const unownedChar = { ...base, equippedCharacterId: "white_fox_miko" };
    const noWeapons = { ...base, ownedWeapons: {} };

    for (const candidate of [unownedChar, noWeapons]) {
      const result = validatePlayerSaveData(candidate);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("SAVE_CORRUPTED");
    }
  });

  it("rejects missing required fields and clearedStageIds outside unlockedStageIds", () => {
    const base = createInitialPlayerSave();
    const missingField: Record<string, unknown> = { ...base };
    delete missingField.permanentStats;
    const invalidSubset = {
      ...base,
      unlockedStageIds: ["stage_1_bamboo"],
      clearedStageIds: ["stage_2_old_road"],
    };

    const r1 = validatePlayerSaveData(missingField);
    const r2 = validatePlayerSaveData(invalidSubset);

    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.error.code).toBe("SAVE_CORRUPTED");
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error.code).toBe("SAVE_CORRUPTED");
  });

  it("rejects prototype pollution keys such as constructor or __proto__", () => {
    const base = createInitialPlayerSave();
    const polluted = {
      ...base,
      equippedCharacterId: "constructor",
    };

    const result = validatePlayerSaveData(polluted);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("SAVE_CORRUPTED");
  });
});
