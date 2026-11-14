import {
  buildStageSelectItems,
  createInitialPlayerSave,
  guardBattleSortie,
  guardProtectedRouteAccess,
} from "@/domain";
import { describe, expect, it } from "vitest";

describe("domain/stage-select (Slice 5 stage list & 401/403 sortie guards)", () => {
  it("builds all 3 stages in order with correct statuses for initial save", () => {
    const save = createInitialPlayerSave(new Date("2026-11-14T00:00:00.000Z"));
    const items = buildStageSelectItems(save);

    expect(items).toHaveLength(3);
    expect(items[0].master.id).toBe("stage_1_bamboo");
    expect(items[0].status).toBe("unverified");
    expect(items[0].isUnlocked).toBe(true);
    expect(items[0].isCleared).toBe(false);
    expect(items[0].isFirstClearBonusAvailable).toBe(true);
    expect(items[0].unlockRequirementName).toBeNull();

    expect(items[1].master.id).toBe("stage_2_old_road");
    expect(items[1].status).toBe("locked");
    expect(items[1].isUnlocked).toBe(false);
    expect(items[1].unlockRequirementName).toBe("第壱節：迷いの竹林");

    expect(items[2].master.id).toBe("stage_3_shrine");
    expect(items[2].status).toBe("locked");
    expect(items[2].unlockRequirementName).toBe("第弐節：枯れ宿場の古道");
  });

  it("marks cleared stage and disables first-clear bonus after clearing stage 1", () => {
    const base = createInitialPlayerSave();
    const save = {
      ...base,
      unlockedStageIds: ["stage_1_bamboo", "stage_2_old_road"],
      clearedStageIds: ["stage_1_bamboo"],
    };
    const items = buildStageSelectItems(save);

    expect(items[0].status).toBe("cleared");
    expect(items[0].isCleared).toBe(true);
    expect(items[0].isFirstClearBonusAvailable).toBe(false);
    expect(items[1].status).toBe("unverified");
    expect(items[1].isUnlocked).toBe(true);
    expect(items[2].status).toBe("locked");
  });

  it("allows sortie when stage is unlocked and equipment is valid", () => {
    const save = createInitialPlayerSave();
    const res = guardBattleSortie(save, "stage_1_bamboo");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.stage.id).toBe("stage_1_bamboo");
      expect(res.data.save.equippedWeaponId).toBe("sword_hamon");
    }
  });

  it("403-equivalent: rejects invalid, empty, or prototype-polluting stageId", () => {
    const save = createInitialPlayerSave();

    for (const badId of ["", "   ", "unknown_stage", "__proto__", "toString"]) {
      const res = guardBattleSortie(save, badId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe("INVALID_STAGE_ID");
      }
    }
  });

  it("403-equivalent: rejects locked stage sortie", () => {
    const save = createInitialPlayerSave();
    const res = guardBattleSortie(save, "stage_2_old_road");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("STAGE_LOCKED");
    }
  });

  it("403-equivalent: rejects empty weapon selection and unowned equipment", () => {
    const base = createInitialPlayerSave();

    const emptyWeaponRes = guardBattleSortie(
      { ...base, equippedWeaponId: "   " },
      "stage_1_bamboo",
    );
    expect(emptyWeaponRes.ok).toBe(false);
    if (!emptyWeaponRes.ok) {
      expect(emptyWeaponRes.error.code).toBe("EMPTY_WEAPON_SELECTION");
    }

    const unownedWeaponRes = guardBattleSortie(
      { ...base, equippedWeaponId: "bow_azusa" },
      "stage_1_bamboo",
    );
    expect(unownedWeaponRes.ok).toBe(false);
    if (!unownedWeaponRes.ok) {
      expect(unownedWeaponRes.error.code).toBe("UNOWNED_WEAPON");
    }

    const unownedCharRes = guardBattleSortie(
      { ...base, equippedCharacterId: "white_fox_miko" },
      "stage_1_bamboo",
    );
    expect(unownedCharRes.ok).toBe(false);
    if (!unownedCharRes.ok) {
      expect(unownedCharRes.error.code).toBe("UNOWNED_CHARACTER");
    }
  });

  it("401/403-equivalent: guardProtectedRouteAccess enforces both session and sortie guards", () => {
    const unauthRes = guardProtectedRouteAccess(null, "stage_1_bamboo");
    expect(unauthRes.ok).toBe(false);
    if (!unauthRes.ok) {
      expect(unauthRes.error.code).toBe("SAVE_CORRUPTED");
    }

    const save = createInitialPlayerSave();
    const lockedRouteRes = guardProtectedRouteAccess(save, "stage_3_shrine");
    expect(lockedRouteRes.ok).toBe(false);
    if (!lockedRouteRes.ok) {
      expect(lockedRouteRes.error.code).toBe("STAGE_LOCKED");
    }
  });
});
