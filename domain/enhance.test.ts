import {
  CHARACTER_MASTER_MAP,
  ENHANCE_STAT_CONFIG_MAP,
  type EnhanceStatKey,
} from "@/data";
import {
  applyEnhanceStat,
  calculateEnhanceCost,
  calculateTotalMetaStats,
  createInitialPlayerSave,
  guardCurrencySufficient,
  guardEnhanceable,
} from "@/domain";
import { describe, expect, it } from "vitest";

describe("domain/enhance (cost, additive stats, and 403 guards)", () => {
  it("calculates enhancement costs accurately across levels", () => {
    expect(calculateEnhanceCost(ENHANCE_STAT_CONFIG_MAP.hpLevel, 0)).toBe(20);
    expect(calculateEnhanceCost(ENHANCE_STAT_CONFIG_MAP.hpLevel, 1)).toBe(30);
    expect(calculateEnhanceCost(ENHANCE_STAT_CONFIG_MAP.atkLevel, 2)).toBe(55);
    expect(calculateEnhanceCost(ENHANCE_STAT_CONFIG_MAP.lukLevel, 14)).toBe(
      310,
    );
  });

  it("calculates total meta stats using additive formula (base + awakening + permanent)", () => {
    const baseSave = createInitialPlayerSave(new Date("2026-11-14T10:00:00Z"));
    const foxChar = CHARACTER_MASTER_MAP.white_fox_miko;
    const progressedSave = {
      ...baseSave,
      permanentStats: { hpLevel: 3, atkLevel: 2, lukLevel: 4 },
      ownedCharacters: {
        ...baseSave.ownedCharacters,
        white_fox_miko: {
          characterId: "white_fox_miko",
          awakeningLevel: 2,
          obtainedAt: "2026-11-14T10:00:00.000Z",
        },
      },
    };

    const stats = calculateTotalMetaStats(progressedSave, foxChar);
    expect(stats).toEqual({
      hp: 100 + 2 * 15 + 3 * 20,
      atk: 22 + 2 * 5 + 2 * 3,
      luk: 12 + 2 * 2 + 4 * 1,
    });
  });

  it("enforces currency guard for magatama and hisui", () => {
    const save = createInitialPlayerSave(new Date("2026-11-14T10:00:00Z"));
    expect(guardCurrencySufficient(save, "magatama", 100).ok).toBe(true);

    const noMagatama = guardCurrencySufficient(save, "magatama", 101);
    expect(noMagatama.ok).toBe(false);
    if (!noMagatama.ok) {
      expect(noMagatama.error.code).toBe("INSUFFICIENT_MAGATAMA");
    }

    const noHisui = guardCurrencySufficient(save, "hisui", 6);
    expect(noHisui.ok).toBe(false);
    if (!noHisui.ok) {
      expect(noHisui.error.code).toBe("INSUFFICIENT_HISUI");
    }

    const invalidCost = guardCurrencySufficient(save, "magatama", -1);
    expect(invalidCost.ok).toBe(false);
  });

  it("applies permanent enhancement immutably when valid", () => {
    const save = createInitialPlayerSave(new Date("2026-11-14T10:00:00Z"));
    const now = new Date("2026-11-14T12:00:00Z");

    const res = applyEnhanceStat(save, "hpLevel", ENHANCE_STAT_CONFIG_MAP, now);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.currencies.magatama).toBe(80);
      expect(res.data.permanentStats.hpLevel).toBe(1);
      expect(res.data.updatedAt).toBe(now.toISOString());
    }
    expect(save.currencies.magatama).toBe(100);
    expect(save.permanentStats.hpLevel).toBe(0);
  });

  it("rejects enhancement when magatama is insufficient (403 equivalent)", () => {
    const save = {
      ...createInitialPlayerSave(new Date("2026-11-14T10:00:00Z")),
      currencies: { magatama: 19, hisui: 5 },
    };

    const guard = guardEnhanceable(save, "hpLevel", 20, 20);
    expect(guard.ok).toBe(false);
    if (!guard.ok) {
      expect(guard.error.code).toBe("INSUFFICIENT_MAGATAMA");
    }

    const applied = applyEnhanceStat(save, "hpLevel");
    expect(applied.ok).toBe(false);
    if (!applied.ok) {
      expect(applied.error.code).toBe("INSUFFICIENT_MAGATAMA");
    }
  });

  it("rejects enhancement when stat is already at max level (403 equivalent)", () => {
    const save = {
      ...createInitialPlayerSave(new Date("2026-11-14T10:00:00Z")),
      currencies: { magatama: 999, hisui: 5 },
      permanentStats: { hpLevel: 20, atkLevel: 0, lukLevel: 0 },
    };

    const applied = applyEnhanceStat(save, "hpLevel");
    expect(applied.ok).toBe(false);
    if (!applied.ok) {
      expect(applied.error.code).toBe("ALREADY_MAX_LEVEL");
    }
  });

  it("rejects unknown statKey against prototype pollution", () => {
    const save = createInitialPlayerSave(new Date("2026-11-14T10:00:00Z"));
    const invalidKey = "toString" as EnhanceStatKey;
    const applied = applyEnhanceStat(save, invalidKey);
    expect(applied.ok).toBe(false);
    if (!applied.ok) {
      expect(applied.error.code).toBe("SAVE_CORRUPTED");
    }
  });
});
