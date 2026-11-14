import {
  executeGachaPull,
  loadOrInitializeSave,
  openPlayerDb,
  seedGachaInsufficientHisuiSave,
  seedGachaMaxedPoolSave,
  seedGachaReadySave,
  seedGachaSingleOnlyHisuiSave,
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

describe("storage/gacha-repository (Slice 3 atomic gacha & 401/403 guards)", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("commits single character pull atomically in one transaction", async () => {
    await seedGachaReadySave();
    const res = await executeGachaPull("character", 1, () => 0.4);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.nextSave.currencies.hisui).toBe(50);
      expect(
        res.data.nextSave.ownedCharacters.white_fox_miko.awakeningLevel,
      ).toBe(0);
    }

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.currencies.hisui).toBe(50);
      expect(
        loaded.data.save.ownedCharacters.white_fox_miko.awakeningLevel,
      ).toBe(0);
    }
  });

  it("commits 10-pull weapon gacha and surplus magatama conversion atomically", async () => {
    await seedGachaMaxedPoolSave();
    // bow_azusa (index 1 -> 0.4) has duplicateRewardMagatama = 50 -> 10 * 50 = +500
    const res = await executeGachaPull("weapon", 10, () => 0.4);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.spentHisui).toBe(50);
      expect(res.data.totalConvertedMagatama).toBe(500);
      expect(res.data.nextSave.currencies).toEqual({ magatama: 600, hisui: 0 });
    }
  });

  it("rejects gacha pull when hisui is insufficient without mutating DB (403 guard)", async () => {
    await seedGachaInsufficientHisuiSave();
    const singleDenied = await executeGachaPull("character", 1, () => 0.4);
    expect(singleDenied.ok).toBe(false);
    if (!singleDenied.ok) {
      expect(singleDenied.error.code).toBe("INSUFFICIENT_HISUI");
    }

    await seedGachaSingleOnlyHisuiSave();
    const multiDenied = await executeGachaPull("weapon", 10, () => 0.4);
    expect(multiDenied.ok).toBe(false);
    if (!multiDenied.ok) {
      expect(multiDenied.error.code).toBe("INSUFFICIENT_HISUI");
    }

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.currencies.hisui).toBe(12);
    }
  });

  it("rejects missing or corrupted save record without overwriting DB (401 guard)", async () => {
    // Missing record
    const missingRes = await executeGachaPull("character", 1, () => 0.4);
    expect(missingRes.ok).toBe(false);
    if (!missingRes.ok) {
      expect(missingRes.error.code).toBe("SAVE_CORRUPTED");
    }

    // Corrupted record (negative hisui)
    const db = await openPlayerDb();
    const tx = db.transaction("playerSave", "readwrite");
    await tx.objectStore("playerSave").put(
      {
        schemaVersion: 1,
        currencies: { magatama: 100, hisui: -5 },
      } as never,
      SAVE_RECORD_KEY,
    );
    await tx.done;
    db.close();

    const corruptedRes = await executeGachaPull("character", 1, () => 0.4);
    expect(corruptedRes.ok).toBe(false);
    if (!corruptedRes.ok) {
      expect(corruptedRes.error.code).toBe("SAVE_CORRUPTED");
    }
  });
});
