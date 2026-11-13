import { LOGIN_BONUS_CONFIG } from "@/data";
import {
  applyLoginBonus,
  createInitialPlayerSave,
  getLocalDateKey,
  guardLoginBonusClaimable,
  isLoginBonusClaimable,
} from "@/domain";
import { describe, expect, it } from "vitest";

describe("domain/login-bonus", () => {
  it("resolves local 0:00 boundary date keys accurately", () => {
    const beforeMidnight = new Date(2026, 10, 14, 23, 59, 59);
    const atMidnight = new Date(2026, 10, 15, 0, 0, 0);

    expect(getLocalDateKey(beforeMidnight)).toBe("2026-11-14");
    expect(getLocalDateKey(atMidnight)).toBe("2026-11-15");
  });

  it("allows claiming when lastLoginBonusDate is null or a previous day", () => {
    const now = new Date(2026, 10, 14, 9, 0, 0);
    const initial = createInitialPlayerSave(now);
    const todayKey = getLocalDateKey(now);

    expect(isLoginBonusClaimable(initial, todayKey)).toBe(true);
    expect(guardLoginBonusClaimable(initial, todayKey)).toEqual({
      ok: true,
      data: true,
    });

    const applied = applyLoginBonus(initial, todayKey, LOGIN_BONUS_CONFIG, now);
    expect(applied.ok).toBe(true);
    if (applied.ok) {
      expect(applied.data.currencies).toEqual({
        magatama: initial.currencies.magatama + LOGIN_BONUS_CONFIG.magatama,
        hisui: initial.currencies.hisui + LOGIN_BONUS_CONFIG.hisui,
      });
      expect(applied.data.lastLoginBonusDate).toBe(todayKey);
      // 元のオブジェクトを破壊しないこと
      expect(initial.lastLoginBonusDate).toBeNull();
    }
  });

  it("403-equivalent: rejects duplicate claim within the same local date", () => {
    const now = new Date(2026, 10, 14, 23, 59, 59);
    const todayKey = getLocalDateKey(now);
    const save = {
      ...createInitialPlayerSave(now),
      lastLoginBonusDate: todayKey,
    };

    expect(isLoginBonusClaimable(save, todayKey)).toBe(false);

    const guardRes = guardLoginBonusClaimable(save, todayKey);
    expect(guardRes.ok).toBe(false);
    if (!guardRes.ok) {
      expect(guardRes.error.code).toBe("LOGIN_BONUS_ALREADY_CLAIMED");
    }

    const applied = applyLoginBonus(save, todayKey, LOGIN_BONUS_CONFIG, now);
    expect(applied.ok).toBe(false);
    if (!applied.ok) {
      expect(applied.error.code).toBe("LOGIN_BONUS_ALREADY_CLAIMED");
    }
  });
});
