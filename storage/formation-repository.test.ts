import {
  loadOrInitializeSave,
  openPlayerDb,
  seedFormationMultiOwnedSave,
  updateFormation,
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

describe("storage/formation-repository (Slice 4 atomic formation & 401/403 guards)", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("commits equipped character change atomically in one transaction", async () => {
    await seedFormationMultiOwnedSave();

    const res = await updateFormation({
      characterId: "white_fox_miko",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.equippedCharacterId).toBe("white_fox_miko");
    }

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.equippedCharacterId).toBe("white_fox_miko");
    }
  });

  it("rejects unowned and empty character without mutating DB (403 guard)", async () => {
    await seedFormationMultiOwnedSave();

    const unownedCharRes = await updateFormation({
      characterId: "shadow_shinobi",
    });
    expect(unownedCharRes.ok).toBe(false);
    if (!unownedCharRes.ok) {
      expect(unownedCharRes.error.code).toBe("UNOWNED_CHARACTER");
    }

    const emptyCharRes = await updateFormation({
      characterId: "",
    });
    expect(emptyCharRes.ok).toBe(false);
    if (!emptyCharRes.ok) {
      expect(emptyCharRes.error.code).toBe("UNOWNED_CHARACTER");
    }

    const loaded = await loadOrInitializeSave();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.save.equippedCharacterId).toBe("apprentice_onmyoji");
    }
  });

  it("rejects missing or corrupted save record without overwriting DB (401 guard)", async () => {
    const missingRes = await updateFormation({
      characterId: "apprentice_onmyoji",
    });
    expect(missingRes.ok).toBe(false);
    if (!missingRes.ok) {
      expect(missingRes.error.code).toBe("SAVE_CORRUPTED");
    }

    const db = await openPlayerDb();
    const tx = db.transaction("playerSave", "readwrite");
    await tx.objectStore("playerSave").put(
      {
        schemaVersion: 1,
        currencies: { magatama: -10, hisui: 5 },
      } as never,
      SAVE_RECORD_KEY,
    );
    await tx.done;
    db.close();

    const corruptedRes = await updateFormation({
      characterId: "apprentice_onmyoji",
    });
    expect(corruptedRes.ok).toBe(false);
    if (!corruptedRes.ok) {
      expect(corruptedRes.error.code).toBe("SAVE_CORRUPTED");
    }
  });
});
