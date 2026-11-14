import {
  enhancePermanentStat,
  enhanceWeaponRefine,
  loadOrInitializeSave,
  openPlayerDb,
  seedEnhanceInsufficientMagatamaSave,
  seedEnhanceMaxedStatSave,
  seedInitialPlayerSave,
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

describe("storage/enhance-repository (atomic tx & 401/403 guards)", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("persists magatama deduction and permanent stat increment atomically", async () => {
    await seedInitialPlayerSave(new Date("2026-11-14T09:00:00Z"));

    const first = await enhancePermanentStat(
      "hpLevel",
      new Date("2026-11-14T10:00:00Z"),
    );
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.data.currencies.magatama).toBe(80);
      expect(first.data.permanentStats.hpLevel).toBe(1);
    }

    const second = await enhancePermanentStat(
      "hpLevel",
      new Date("2026-11-14T10:01:00Z"),
    );
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.data.currencies.magatama).toBe(50);
      expect(second.data.permanentStats.hpLevel).toBe(2);
    }

    const reloaded = await loadOrInitializeSave();
    expect(reloaded.ok).toBe(true);
    if (reloaded.ok) {
      expect(reloaded.data.save.currencies.magatama).toBe(50);
      expect(reloaded.data.save.permanentStats.hpLevel).toBe(2);
    }
  });

  it("rejects with INSUFFICIENT_MAGATAMA and keeps DB unchanged (403 equivalent)", async () => {
    await seedEnhanceInsufficientMagatamaSave();

    const res = await enhancePermanentStat("hpLevel");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("INSUFFICIENT_MAGATAMA");
    }

    const reloaded = await loadOrInitializeSave();
    expect(reloaded.ok).toBe(true);
    if (reloaded.ok) {
      expect(reloaded.data.save.currencies.magatama).toBe(10);
      expect(reloaded.data.save.permanentStats.hpLevel).toBe(0);
    }
  });

  it("rejects with ALREADY_MAX_LEVEL and keeps DB unchanged (403 equivalent)", async () => {
    await seedEnhanceMaxedStatSave();

    const res = await enhancePermanentStat("lukLevel");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("ALREADY_MAX_LEVEL");
    }

    const reloaded = await loadOrInitializeSave();
    expect(reloaded.ok).toBe(true);
    if (reloaded.ok) {
      expect(reloaded.data.save.currencies.magatama).toBe(500);
      expect(reloaded.data.save.permanentStats.lukLevel).toBe(15);
    }
  });

  it("rejects uninitialized DB with SAVE_CORRUPTED (401 equivalent)", async () => {
    const db = await openPlayerDb();
    db.close();

    const res = await enhancePermanentStat("hpLevel");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("SAVE_CORRUPTED");
    }
  });

  it("rejects corrupted save record without overwriting it (401 equivalent)", async () => {
    await seedInitialPlayerSave();

    const db = await openPlayerDb();
    const tx = db.transaction("playerSave", "readwrite");
    const store = tx.objectStore("playerSave");
    const existing = await store.get(SAVE_RECORD_KEY);
    expect(existing).toBeDefined();
    if (!existing) {
      return;
    }
    await store.put(
      {
        ...existing,
        permanentStats: { hpLevel: 999, atkLevel: 0, lukLevel: 0 },
      },
      SAVE_RECORD_KEY,
    );
    await tx.done;
    db.close();

    const res = await enhancePermanentStat("atkLevel");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("SAVE_CORRUPTED");
    }

    const dbCheck = await openPlayerDb();
    const raw = await dbCheck.get("playerSave", SAVE_RECORD_KEY);
    dbCheck.close();
    expect(raw?.permanentStats.hpLevel).toBe(999);
    expect(raw?.permanentStats.atkLevel).toBe(0);
  });

  it("refines owned weapon and persists refineLevel & magatama deduction", async () => {
    await seedInitialPlayerSave();
    const db = await openPlayerDb();
    const tx = db.transaction("playerSave", "readwrite");
    const store = tx.objectStore("playerSave");
    const existing = await store.get(SAVE_RECORD_KEY);
    if (existing) {
      await store.put(
        {
          ...existing,
          currencies: { ...existing.currencies, magatama: 100 },
        },
        SAVE_RECORD_KEY,
      );
    }
    await tx.done;
    db.close();

    const res = await enhanceWeaponRefine("sword_hamon");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.ownedWeapons.sword_hamon.refineLevel).toBe(1);
      expect(res.data.currencies.magatama).toBe(70);
    }

    const reloaded = await loadOrInitializeSave();
    expect(reloaded.ok).toBe(true);
    if (reloaded.ok) {
      expect(reloaded.data.save.ownedWeapons.sword_hamon.refineLevel).toBe(1);
      expect(reloaded.data.save.currencies.magatama).toBe(70);
    }
  });

  it("403-equivalent: rejects unowned weapon and insufficient magatama in enhanceWeaponRefine", async () => {
    await seedEnhanceInsufficientMagatamaSave();

    const insufficientRes = await enhanceWeaponRefine("sword_hamon");
    expect(insufficientRes.ok).toBe(false);
    if (!insufficientRes.ok) {
      expect(insufficientRes.error.code).toBe("INSUFFICIENT_MAGATAMA");
    }

    const unownedRes = await enhanceWeaponRefine("bow_azusa");
    expect(unownedRes.ok).toBe(false);
    if (!unownedRes.ok) {
      expect(unownedRes.error.code).toBe("UNOWNED_WEAPON");
    }
  });

  it("401-equivalent: rejects enhanceWeaponRefine when save record is missing", async () => {
    const res = await enhanceWeaponRefine("sword_hamon");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("SAVE_CORRUPTED");
    }
  });
});
