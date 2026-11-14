import {
  loadOrInitializeSave,
  openPlayerDb,
  resetPlayerSaveToInitial,
  seedInitialPlayerSave,
  seedPlayerSave,
} from "@/storage";
import { DB_NAME, DB_VERSION, SAVE_RECORD_KEY } from "@/types";
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("storage/save-repository & IndexedDB migration", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("runs v1 migration to create playerSave store and seeds initial save on first boot", async () => {
    const db = await openPlayerDb();
    expect(db.version).toBe(DB_VERSION);
    expect(db.objectStoreNames.contains("playerSave")).toBe(true);
    db.close();

    const first = await loadOrInitializeSave(
      new Date("2026-11-14T00:00:00.000Z"),
    );
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.data.isInitial).toBe(true);
      expect(first.data.save.equippedCharacterId).toBe("apprentice_onmyoji");
      expect(first.data.save.currencies).toEqual({ magatama: 100, hisui: 5 });
      expect(first.data.save.unlockedStageIds).toEqual(["stage_1_bamboo"]);
    }

    const second = await loadOrInitializeSave();
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.data.isInitial).toBe(false);
    }
  });

  it("returns SAVE_CORRUPTED without overwriting corrupted data, then recovers on reset", async () => {
    const db = await openPlayerDb();
    const tx = db.transaction("playerSave", "readwrite");
    await tx
      .objectStore("playerSave")
      .put({ broken: true } as never, SAVE_RECORD_KEY);
    await tx.done;
    db.close();

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(false);
    if (!loaded.ok) {
      expect(loaded.error.code).toBe("SAVE_CORRUPTED");
    }

    const reset = await resetPlayerSaveToInitial();
    expect(reset.ok).toBe(true);

    const recovered = await loadOrInitializeSave();
    expect(recovered.ok).toBe(true);
    if (recovered.ok) {
      expect(recovered.data.isInitial).toBe(false);
      expect(recovered.data.save.currencies).toEqual({
        magatama: 100,
        hisui: 5,
      });
    }
  });

  it("supports seed helpers for test & verification data setup", async () => {
    const seeded = await seedInitialPlayerSave(
      new Date("2026-11-14T00:00:00.000Z"),
    );
    expect(seeded.ok).toBe(true);
    if (!seeded.ok) return;

    const custom = {
      ...seeded.data,
      currencies: { magatama: 500, hisui: 50 },
    };
    const customResult = await seedPlayerSave(custom);
    expect(customResult.ok).toBe(true);

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.currencies).toEqual({ magatama: 500, hisui: 50 });
    }
  });

  it("401-equivalent: returns STORAGE_ERROR and logs context when IndexedDB fails", async () => {
    const openSpy = vi.spyOn(indexedDB, "open").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError");
    });
    const errorLogSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await loadOrInitializeSave();
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("STORAGE_ERROR");
    }
    expect(errorLogSpy).toHaveBeenCalledTimes(1);

    openSpy.mockRestore();
    errorLogSpy.mockRestore();
  });
});
