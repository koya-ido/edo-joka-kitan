import { LOGIN_BONUS_CONFIG } from "@/data";
import { getLocalDateKey } from "@/domain";
import {
  claimLoginBonus,
  loadOrInitializeSave,
  openPlayerDb,
  resetPlayerSave,
  seedResettableProgressSave,
  seedUnclaimedLoginBonusSave,
} from "@/storage";
import { DB_NAME, SAVE_RECORD_KEY } from "@/types";
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

describe("storage/login-bonus-repository & save reset", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("claims login bonus across 0:00 boundary and rejects duplicate claim on same day (403-equivalent)", async () => {
    const day1 = new Date(2026, 10, 14, 23, 59, 59);
    await seedUnclaimedLoginBonusSave("2026-11-13", day1);

    const firstClaim = await claimLoginBonus(day1);
    expect(firstClaim.ok).toBe(true);
    if (firstClaim.ok) {
      expect(firstClaim.data.currencies).toEqual({
        magatama: 100 + LOGIN_BONUS_CONFIG.magatama,
        hisui: 5 + LOGIN_BONUS_CONFIG.hisui,
      });
      expect(firstClaim.data.lastLoginBonusDate).toBe(getLocalDateKey(day1));
    }

    // 同日内の二重受取は 403 相当で拒否され、残高が変化しないこと
    const duplicateClaim = await claimLoginBonus(day1);
    expect(duplicateClaim.ok).toBe(false);
    if (!duplicateClaim.ok) {
      expect(duplicateClaim.error.code).toBe("LOGIN_BONUS_ALREADY_CLAIMED");
    }

    const reloadedAfterDup = await loadOrInitializeSave(day1);
    expect(reloadedAfterDup.ok).toBe(true);
    if (reloadedAfterDup.ok) {
      expect(reloadedAfterDup.data.save.currencies).toEqual({
        magatama: 100 + LOGIN_BONUS_CONFIG.magatama,
        hisui: 5 + LOGIN_BONUS_CONFIG.hisui,
      });
    }

    // 翌日 00:00:00 以降は再び受取可能
    const day2 = new Date(2026, 10, 15, 0, 0, 0);
    const nextDayClaim = await claimLoginBonus(day2);
    expect(nextDayClaim.ok).toBe(true);
    if (nextDayClaim.ok) {
      expect(nextDayClaim.data.currencies).toEqual({
        magatama: 100 + LOGIN_BONUS_CONFIG.magatama * 2,
        hisui: 5 + LOGIN_BONUS_CONFIG.hisui * 2,
      });
      expect(nextDayClaim.data.lastLoginBonusDate).toBe("2026-11-15");
    }
  });

  it("401-equivalent: rejects claimLoginBonus when save record is missing", async () => {
    const res = await claimLoginBonus(new Date(2026, 10, 14, 12, 0, 0));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("SAVE_CORRUPTED");
    }
  });

  it("401-equivalent: rejects claimLoginBonus when save record is corrupted without overwriting", async () => {
    const db = await openPlayerDb();
    const tx = db.transaction("playerSave", "readwrite");
    await tx
      .objectStore("playerSave")
      .put(
        { broken: true, currencies: { magatama: -10 } } as never,
        SAVE_RECORD_KEY,
      );
    await tx.done;
    db.close();

    const res = await claimLoginBonus(new Date(2026, 10, 14, 12, 0, 0));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("SAVE_CORRUPTED");
    }

    // 破損レコードが上書きされていないことを確認
    const check = await loadOrInitializeSave();
    expect(check.ok).toBe(false);
    if (!check.ok) {
      expect(check.error.code).toBe("SAVE_CORRUPTED");
    }
  });

  it("resets progressed save data back to initial state via resetPlayerSave", async () => {
    await seedResettableProgressSave();

    const reset = await resetPlayerSave(new Date(2026, 10, 14, 10, 0, 0));
    expect(reset.ok).toBe(true);
    if (reset.ok) {
      expect(reset.data.currencies).toEqual({ magatama: 100, hisui: 5 });
      expect(reset.data.permanentStats).toEqual({
        hpLevel: 0,
        atkLevel: 0,
        lukLevel: 0,
      });
      expect(reset.data.unlockedStageIds).toEqual(["stage_1_bamboo"]);
      expect(reset.data.clearedStageIds).toEqual([]);
      expect(reset.data.lastLoginBonusDate).toBeNull();
    }
  });

  it("returns STORAGE_ERROR and logs context when IndexedDB fails", async () => {
    const openSpy = vi.spyOn(indexedDB, "open").mockImplementationOnce(() => {
      throw new Error("IndexedDB unavailable");
    });
    const errorLogSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await claimLoginBonus();
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("STORAGE_ERROR");
    }
    expect(errorLogSpy).toHaveBeenCalledTimes(1);

    openSpy.mockRestore();
    errorLogSpy.mockRestore();
  });
});
