import {
  createInitialPlayerSave,
  guardProtectedRouteAccess,
  guardSessionEstablished,
} from "@/domain";
import { describe, expect, it } from "vitest";

describe("domain/session-guard (401/403 authorization boundaries)", () => {
  it("allows access when session save is established and valid", () => {
    const save = createInitialPlayerSave(new Date("2026-11-14T00:00:00.000Z"));
    const sessionRes = guardSessionEstablished(save);
    expect(sessionRes.ok).toBe(true);

    const routeRes = guardProtectedRouteAccess(save, "stage_1_bamboo");
    expect(routeRes.ok).toBe(true);
  });

  it("401-equivalent: rejects null, undefined, or corrupted session save", () => {
    const nullRes = guardSessionEstablished(null);
    expect(nullRes.ok).toBe(false);
    if (!nullRes.ok) expect(nullRes.error.code).toBe("SAVE_CORRUPTED");

    const undefinedRes = guardProtectedRouteAccess(undefined, "stage_1_bamboo");
    expect(undefinedRes.ok).toBe(false);
    if (!undefinedRes.ok)
      expect(undefinedRes.error.code).toBe("SAVE_CORRUPTED");

    const corrupted = {
      ...createInitialPlayerSave(),
      currencies: { magatama: -50, hisui: 5 },
    };
    const corruptedRes = guardSessionEstablished(corrupted);
    expect(corruptedRes.ok).toBe(false);
    if (!corruptedRes.ok)
      expect(corruptedRes.error.code).toBe("SAVE_CORRUPTED");
  });

  it("403-equivalent: rejects locked stage or invalid stageId on protected battle route", () => {
    const save = createInitialPlayerSave();

    const lockedRes = guardProtectedRouteAccess(save, "stage_2_old_road");
    expect(lockedRes.ok).toBe(false);
    if (!lockedRes.ok) expect(lockedRes.error.code).toBe("STAGE_LOCKED");

    const invalidRes = guardProtectedRouteAccess(save, "non_existent_stage");
    expect(invalidRes.ok).toBe(false);
    if (!invalidRes.ok) expect(invalidRes.error.code).toBe("INVALID_STAGE_ID");

    const prototypeKeyRes = guardProtectedRouteAccess(save, "toString");
    expect(prototypeKeyRes.ok).toBe(false);
    if (!prototypeKeyRes.ok)
      expect(prototypeKeyRes.error.code).toBe("INVALID_STAGE_ID");
  });
});
