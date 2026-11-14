import { createInitialPlayerSave, prepareBattleSession } from "@/domain";
import type { PlayerSaveData } from "@/types";
import { describe, expect, it } from "vitest";

const FIXED_NOW = new Date("2026-11-14T10:00:00.000Z");

describe("domain/battle-session (401/403 guards & launch context)", () => {
  it("builds verified BattleLaunchContext for valid unlocked stage", () => {
    const save = createInitialPlayerSave(FIXED_NOW);
    const result = prepareBattleSession(save, "stage_1_bamboo");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.stage.id).toBe("stage_1_bamboo");
      expect(result.data.character.id).toBe("apprentice_onmyoji");
      expect(result.data.weapon.id).toBe("sword_hamon");
      expect(result.data.metaStats).toEqual({
        hp: 120,
        atk: 20,
        luk: 5,
      });
    }
  });

  it("rejects null or undefined save with SAVE_CORRUPTED (401 equivalent)", () => {
    const nullResult = prepareBattleSession(null, "stage_1_bamboo");
    expect(nullResult.ok).toBe(false);
    if (!nullResult.ok) {
      expect(nullResult.error.code).toBe("SAVE_CORRUPTED");
    }

    const undefinedResult = prepareBattleSession(undefined, "stage_1_bamboo");
    expect(undefinedResult.ok).toBe(false);
    if (!undefinedResult.ok) {
      expect(undefinedResult.error.code).toBe("SAVE_CORRUPTED");
    }
  });

  it("rejects tampered negative currency save with SAVE_CORRUPTED (401 equivalent)", () => {
    const base = createInitialPlayerSave(FIXED_NOW);
    const corruptedSave: PlayerSaveData = {
      ...base,
      currencies: { magatama: -10, hisui: 5 },
    };

    const result = prepareBattleSession(corruptedSave, "stage_1_bamboo");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("SAVE_CORRUPTED");
    }
  });

  it("rejects locked stage sortie with STAGE_LOCKED (403 equivalent)", () => {
    const save = createInitialPlayerSave(FIXED_NOW);
    const result = prepareBattleSession(save, "stage_2_old_road");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("STAGE_LOCKED");
    }
  });

  it("rejects unknown stageId with INVALID_STAGE_ID (403 equivalent)", () => {
    const save = createInitialPlayerSave(FIXED_NOW);
    const result = prepareBattleSession(save, "stage_unknown_999");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_STAGE_ID");
    }
  });

  it("rejects empty weapon selection with SAVE_CORRUPTED or EMPTY_WEAPON_SELECTION (401/403 guard)", () => {
    const base = createInitialPlayerSave(FIXED_NOW);
    const noWeaponSave: PlayerSaveData = {
      ...base,
      equippedWeaponId: "",
    };

    const result = prepareBattleSession(noWeaponSave, "stage_1_bamboo");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(["SAVE_CORRUPTED", "EMPTY_WEAPON_SELECTION"]).toContain(
        result.error.code,
      );
    }
  });
});
