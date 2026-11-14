import { STAGE_MASTER_MAP } from "@/data";
import { WAVE_RESCUE_MAGATAMA } from "@/domain";
import {
  commitBattleResult,
  loadOrInitializeSave,
  openPlayerDb,
  rerollBattleChoices,
  seedBattleInsufficientRerollSave,
  seedBattleRerollReadySave,
  seedBattleStage2FirstClearReadySave,
} from "@/storage";
import { DB_NAME, SAVE_RECORD_KEY } from "@/types";
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

const clearDatabase = async (): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(new Error("Failed to delete IndexedDB"));
    };
    request.onblocked = () => {
      resolve();
    };
  });
};

describe("storage/battle-repository (Slice 7 persistence & 401/403 guards)", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("401-equivalent: rejects reroll and commitBattleResult when save record is missing or corrupted", async () => {
    const db = await openPlayerDb();
    db.close();

    const rerollMissing = await rerollBattleChoices(30);
    expect(rerollMissing.ok).toBe(false);
    if (!rerollMissing.ok) {
      expect(rerollMissing.error.code).toBe("SAVE_CORRUPTED");
    }

    const commitMissing = await commitBattleResult({
      stageId: "stage_1_bamboo",
      outcome: "victory",
      reachedWave: 10,
    });
    expect(commitMissing.ok).toBe(false);
    if (!commitMissing.ok) {
      expect(commitMissing.error.code).toBe("SAVE_CORRUPTED");
    }

    const corruptDb = await openPlayerDb();
    const tx = corruptDb.transaction("playerSave", "readwrite");
    await tx
      .objectStore("playerSave")
      .put(
        { schemaVersion: 1, currencies: { magatama: -50, hisui: 0 } } as never,
        SAVE_RECORD_KEY,
      );
    await tx.done;
    corruptDb.close();

    const commitCorrupt = await commitBattleResult({
      stageId: "stage_1_bamboo",
      outcome: "defeat",
      reachedWave: 2,
    });
    expect(commitCorrupt.ok).toBe(false);
    if (!commitCorrupt.ok) {
      expect(commitCorrupt.error.code).toBe("SAVE_CORRUPTED");
    }
  });

  it("403-equivalent: rejects reroll when magatama is insufficient and keeps balance unchanged", async () => {
    await seedBattleInsufficientRerollSave();

    const rejected = await rerollBattleChoices(30);
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.error.code).toBe("INSUFFICIENT_MAGATAMA");
    }

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.currencies.magatama).toBe(20);
    }
  });

  it("403-equivalent: rejects commitBattleResult for locked or unknown stage without mutating save", async () => {
    await seedBattleRerollReadySave();

    const locked = await commitBattleResult({
      stageId: "stage_2_old_road",
      outcome: "victory",
      reachedWave: 10,
    });
    expect(locked.ok).toBe(false);
    if (!locked.ok) {
      expect(locked.error.code).toBe("STAGE_LOCKED");
    }

    const invalid = await commitBattleResult({
      stageId: "stage_invalid",
      outcome: "victory",
      reachedWave: 10,
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.error.code).toBe("INVALID_STAGE_ID");
    }

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.currencies.magatama).toBe(60);
      expect(loaded.data.save.clearedStageIds).toEqual([]);
    }
  });

  it("persists reroll magatama deduction atomically", async () => {
    await seedBattleRerollReadySave();

    const res = await rerollBattleChoices(30);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.currencies.magatama).toBe(30);
    }

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.currencies.magatama).toBe(30);
    }
  });

  it("persists victory rewards, first-clear hisui bonus, clearedStageIds, and next stage unlock atomically", async () => {
    await seedBattleStage2FirstClearReadySave();
    const stage2 = STAGE_MASTER_MAP.stage_2_old_road;

    const committed = await commitBattleResult({
      stageId: "stage_2_old_road",
      outcome: "victory",
      reachedWave: 10,
    });
    expect(committed.ok).toBe(true);
    if (committed.ok) {
      expect(committed.data.reward.newlyUnlockedStageId).toBe("stage_3_shrine");
      expect(committed.data.save.currencies.magatama).toBe(
        150 + stage2.clearReward.magatama,
      );
      expect(committed.data.save.currencies.hisui).toBe(
        10 + stage2.clearReward.hisui + stage2.firstClearBonusHisui,
      );
      expect(committed.data.save.clearedStageIds).toEqual([
        "stage_1_bamboo",
        "stage_2_old_road",
      ]);
      expect(committed.data.save.unlockedStageIds).toEqual([
        "stage_1_bamboo",
        "stage_2_old_road",
        "stage_3_shrine",
      ]);
    }
  });

  it("persists defeat rescue magatama without unlocking or clearing stage", async () => {
    await seedBattleRerollReadySave();

    const committed = await commitBattleResult({
      stageId: "stage_1_bamboo",
      outcome: "defeat",
      reachedWave: 5,
    });
    expect(committed.ok).toBe(true);
    if (committed.ok) {
      expect(committed.data.reward.earnedMagatama).toBe(
        5 * WAVE_RESCUE_MAGATAMA,
      );
      expect(committed.data.reward.earnedHisui).toBe(0);
      expect(committed.data.save.currencies.magatama).toBe(
        60 + 5 * WAVE_RESCUE_MAGATAMA,
      );
      expect(committed.data.save.clearedStageIds).toEqual([]);
      expect(committed.data.save.unlockedStageIds).toEqual(["stage_1_bamboo"]);
    }
  });
});
