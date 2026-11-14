import {
  loadOrInitializeSave,
  openPlayerDb,
  seedStageAllClearedSave,
  seedStageInitialStateSave,
  seedStageMidProgressSave,
} from "@/storage";
import { DB_NAME, DB_VERSION } from "@/types";
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

describe("storage/seed-stage-select (Slice 5 migration & seed verification)", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("executes IndexedDB v1 migration and verifies playerSave store", async () => {
    const db = await openPlayerDb();
    expect(db.version).toBe(DB_VERSION);
    expect(db.objectStoreNames.contains("playerSave")).toBe(true);
    db.close();
  });

  it("seeds initial stage state (stage_1_bamboo unlocked only)", async () => {
    const seeded = await seedStageInitialStateSave();
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.unlockedStageIds).toEqual(["stage_1_bamboo"]);
      expect(loaded.data.save.clearedStageIds).toEqual([]);
    }
  });

  it("seeds mid-progress stage state (stage_1 cleared, stage_2 unlocked)", async () => {
    const seeded = await seedStageMidProgressSave();
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.unlockedStageIds).toEqual([
        "stage_1_bamboo",
        "stage_2_old_road",
      ]);
      expect(loaded.data.save.clearedStageIds).toEqual(["stage_1_bamboo"]);
    }
  });

  it("seeds all-cleared stage state (all 3 stages unlocked and cleared)", async () => {
    const seeded = await seedStageAllClearedSave();
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.unlockedStageIds).toEqual([
        "stage_1_bamboo",
        "stage_2_old_road",
        "stage_3_shrine",
      ]);
      expect(loaded.data.save.clearedStageIds).toEqual([
        "stage_1_bamboo",
        "stage_2_old_road",
        "stage_3_shrine",
      ]);
    }
  });
});
