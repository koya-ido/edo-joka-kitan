import {
  loadOrInitializeSave,
  openPlayerDb,
  seedClaimedLoginBonusSave,
  seedEnhanceInsufficientMagatamaSave,
  seedEnhanceMaxedStatSave,
  seedEnhanceMidProgressSave,
  seedResettableProgressSave,
  seedUnclaimedLoginBonusSave,
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

describe("storage/seed (Slice 1 migration & seed verification)", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("executes IndexedDB v1 migration and verifies playerSave store", async () => {
    const db = await openPlayerDb();
    expect(db.version).toBe(DB_VERSION);
    expect(db.objectStoreNames.contains("playerSave")).toBe(true);
    db.close();
  });

  it("seeds unclaimed login bonus save for 0:00 boundary testing", async () => {
    const seeded = await seedUnclaimedLoginBonusSave("2026-11-13");
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.isInitial).toBe(false);
      expect(loaded.data.save.lastLoginBonusDate).toBe("2026-11-13");
      expect(loaded.data.save.currencies).toEqual({ magatama: 100, hisui: 5 });
    }
  });

  it("seeds claimed login bonus save for disabled/duplicate guard testing", async () => {
    const seeded = await seedClaimedLoginBonusSave("2026-11-14");
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.lastLoginBonusDate).toBe("2026-11-14");
      expect(loaded.data.save.currencies).toEqual({ magatama: 150, hisui: 10 });
    }
  });

  it("seeds resettable progress save for save-reset confirmation testing", async () => {
    const seeded = await seedResettableProgressSave();
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.currencies).toEqual({ magatama: 450, hisui: 25 });
      expect(loaded.data.save.permanentStats).toEqual({
        hpLevel: 2,
        atkLevel: 1,
        lukLevel: 1,
      });
      expect(loaded.data.save.unlockedStageIds).toEqual([
        "stage_1_bamboo",
        "stage_2_old_road",
      ]);
      expect(loaded.data.save.clearedStageIds).toEqual(["stage_1_bamboo"]);
    }
  });

  it("seeds insufficient magatama save for Slice 2 enhance guard testing", async () => {
    const seeded = await seedEnhanceInsufficientMagatamaSave();
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.currencies.magatama).toBe(10);
      expect(loaded.data.save.permanentStats).toEqual({
        hpLevel: 0,
        atkLevel: 0,
        lukLevel: 0,
      });
    }
  });

  it("seeds maxed permanent stats save for Slice 2 max-level guard testing", async () => {
    const seeded = await seedEnhanceMaxedStatSave();
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.currencies.magatama).toBe(500);
      expect(loaded.data.save.permanentStats).toEqual({
        hpLevel: 20,
        atkLevel: 20,
        lukLevel: 15,
      });
    }
  });

  it("seeds mid-progress permanent stats save for Slice 2 stat calculation testing", async () => {
    const seeded = await seedEnhanceMidProgressSave();
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.currencies.magatama).toBe(300);
      expect(loaded.data.save.permanentStats).toEqual({
        hpLevel: 3,
        atkLevel: 2,
        lukLevel: 1,
      });
    }
  });
});
