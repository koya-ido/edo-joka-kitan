import { WEAPON_MASTERS } from "@/data";
import { guardBattleSortie, guardCurrencySufficient } from "@/domain";
import {
  loadOrInitializeSave,
  openPlayerDb,
  seedBattleAllWeaponsReadySave,
  seedBattleInsufficientRerollSave,
  seedBattleMidProgressSave,
  seedBattleRerollReadySave,
  seedBattleStage2FirstClearReadySave,
  seedBattleStarterSave,
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

describe("storage/seed-battle (Slice 6 migration & battle seed verification)", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("verifies IndexedDB v1 migration and playerSave store availability", async () => {
    const db = await openPlayerDb();
    expect(db.version).toBe(DB_VERSION);
    expect(db.objectStoreNames.contains("playerSave")).toBe(true);
    db.close();
  });

  it("seeds starter battle save and passes sortie guard for stage_1_bamboo", async () => {
    const seeded = await seedBattleStarterSave();
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.equippedCharacterId).toBe("apprentice_onmyoji");
      expect(loaded.data.save.equippedWeaponId).toBe("sword_hamon");
      const guard = guardBattleSortie(loaded.data.save, "stage_1_bamboo");
      expect(guard.ok).toBe(true);
    }
  });

  it("seeds mid-progress battle save with permanent stats and stage_2_old_road unlocked", async () => {
    const seeded = await seedBattleMidProgressSave();
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.permanentStats).toEqual({
        hpLevel: 3,
        atkLevel: 2,
        lukLevel: 2,
      });
      const guard = guardBattleSortie(loaded.data.save, "stage_2_old_road");
      expect(guard.ok).toBe(true);
    }
  });

  it("seeds all 9 weapon genres and all 3 characters ready for battle verification", async () => {
    expect(WEAPON_MASTERS).toHaveLength(9);

    const seeded = await seedBattleAllWeaponsReadySave(
      "white_fox_miko",
      "orb_magatama",
    );
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(Object.keys(loaded.data.save.ownedWeapons)).toHaveLength(9);
      expect(Object.keys(loaded.data.save.ownedCharacters)).toHaveLength(3);
      expect(loaded.data.save.equippedCharacterId).toBe("white_fox_miko");
      expect(loaded.data.save.equippedWeaponId).toBe("orb_magatama");
      const guard = guardBattleSortie(loaded.data.save, "stage_3_shrine");
      expect(guard.ok).toBe(true);
    }
  });

  it("seeds Slice 7 reroll-ready save and passes magatama currency guard", async () => {
    const seeded = await seedBattleRerollReadySave();
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.currencies.magatama).toBe(60);
      const guard = guardCurrencySufficient(loaded.data.save, "magatama", 30);
      expect(guard.ok).toBe(true);
    }
  });

  it("seeds Slice 7 insufficient-reroll save and rejects reroll guard with INSUFFICIENT_MAGATAMA", async () => {
    const seeded = await seedBattleInsufficientRerollSave();
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.currencies.magatama).toBe(20);
      const guard = guardCurrencySufficient(loaded.data.save, "magatama", 30);
      expect(guard.ok).toBe(false);
      if (!guard.ok) {
        expect(guard.error.code).toBe("INSUFFICIENT_MAGATAMA");
      }
    }
  });

  it("seeds Slice 7 stage 2 first-clear-ready save with stage_1_bamboo cleared and stage_2_old_road uncleared", async () => {
    const seeded = await seedBattleStage2FirstClearReadySave();
    expect(seeded.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.clearedStageIds).toEqual(["stage_1_bamboo"]);
      expect(loaded.data.save.unlockedStageIds).toEqual([
        "stage_1_bamboo",
        "stage_2_old_road",
      ]);
      const guard = guardBattleSortie(loaded.data.save, "stage_2_old_road");
      expect(guard.ok).toBe(true);
    }
  });
});
