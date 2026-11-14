import { STAGE_MASTER_MAP, STAGE_MASTERS } from "@/data";
import {
  applyBattleRerollCost,
  applyBattleResultToSave,
  calculateBattleRewards,
  createInitialPlayerSave,
  WAVE_RESCUE_MAGATAMA,
} from "@/domain";
import { describe, expect, it } from "vitest";

describe("domain/battle-reward", () => {
  const fixedNow = new Date("2026-11-14T16:30:00.000Z");

  it("calculates victory rewards with firstClearBonusHisui and next stage unlock", () => {
    const save = createInitialPlayerSave(fixedNow);
    const stage1 = STAGE_MASTER_MAP.stage_1_bamboo;
    const reward = calculateBattleRewards({
      save,
      stage: stage1,
      outcome: "victory",
      reachedWave: 10,
      allStages: STAGE_MASTERS,
    });

    expect(reward).toEqual({
      stageId: "stage_1_bamboo",
      outcome: "victory",
      reachedWave: 10,
      earnedMagatama: stage1.clearReward.magatama,
      earnedHisui: stage1.clearReward.hisui + stage1.firstClearBonusHisui,
      newlyUnlockedStageId: "stage_2_old_road",
    });
  });

  it("omits firstClearBonusHisui and newlyUnlockedStageId on repeat victory", () => {
    const base = createInitialPlayerSave(fixedNow);
    const clearedSave = {
      ...base,
      unlockedStageIds: ["stage_1_bamboo", "stage_2_old_road"],
      clearedStageIds: ["stage_1_bamboo"],
    };
    const stage1 = STAGE_MASTER_MAP.stage_1_bamboo;
    const reward = calculateBattleRewards({
      save: clearedSave,
      stage: stage1,
      outcome: "victory",
      reachedWave: 10,
      allStages: STAGE_MASTERS,
    });

    expect(reward.earnedHisui).toBe(stage1.clearReward.hisui);
    expect(reward.newlyUnlockedStageId).toBeNull();
  });

  it("calculates defeat rescue magatama based on reached wave", () => {
    const save = createInitialPlayerSave(fixedNow);
    const reward = calculateBattleRewards({
      save,
      stage: STAGE_MASTER_MAP.stage_1_bamboo,
      outcome: "defeat",
      reachedWave: 4,
      allStages: STAGE_MASTERS,
    });

    expect(reward.earnedMagatama).toBe(4 * WAVE_RESCUE_MAGATAMA);
    expect(reward.earnedHisui).toBe(0);
    expect(reward.newlyUnlockedStageId).toBeNull();
  });

  it("rejects reroll with INSUFFICIENT_MAGATAMA (403-equivalent)", () => {
    const base = createInitialPlayerSave(fixedNow);
    const lowSave = {
      ...base,
      currencies: { magatama: 29, hisui: 5 },
    };

    const res = applyBattleRerollCost(lowSave, 30, fixedNow);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("INSUFFICIENT_MAGATAMA");
    }
  });

  it("rejects battle result commit for locked or unknown stage (403-equivalent)", () => {
    const save = createInitialPlayerSave(fixedNow);

    const lockedRes = applyBattleResultToSave(
      save,
      { stageId: "stage_2_old_road", outcome: "victory", reachedWave: 10 },
      STAGE_MASTER_MAP,
      STAGE_MASTERS,
      fixedNow,
    );
    expect(lockedRes.ok).toBe(false);
    if (!lockedRes.ok) {
      expect(lockedRes.error.code).toBe("STAGE_LOCKED");
    }

    const unknownRes = applyBattleResultToSave(
      save,
      { stageId: "stage_unknown", outcome: "victory", reachedWave: 10 },
      STAGE_MASTER_MAP,
      STAGE_MASTERS,
      fixedNow,
    );
    expect(unknownRes.ok).toBe(false);
    if (!unknownRes.ok) {
      expect(unknownRes.error.code).toBe("INVALID_STAGE_ID");
    }
  });
});
