import { LOGIN_BONUS_CONFIG } from "@/data";
import { err, ok } from "@/domain/result";
import type { DomainResult, LoginBonusConfig, PlayerSaveData } from "@/types";

const pad2 = (value: number): string => String(value).padStart(2, "0");

/** ローカルタイムゾーン基準の YYYY-MM-DD 日付キーを返す（0:00境界判定用） */
export const getLocalDateKey = (now: Date = new Date()): string => {
  const year = String(now.getFullYear());
  const month = pad2(now.getMonth() + 1);
  const day = pad2(now.getDate());
  return `${year}-${month}-${day}`;
};

/** 当日 0:00 境界内でログインボーナスが未受取かどうかを判定する */
export const isLoginBonusClaimable = (
  save: PlayerSaveData,
  todayKey: string,
): boolean => save.lastLoginBonusDate !== todayKey;

/** 403相当ガード: 同日二重受取を拒否する */
export const guardLoginBonusClaimable = (
  save: PlayerSaveData,
  todayKey: string,
): DomainResult<true> => {
  if (!isLoginBonusClaimable(save, todayKey)) {
    return err(
      "LOGIN_BONUS_ALREADY_CLAIMED",
      "本日のログインボーナスは既に受取済みです。",
    );
  }
  return ok(true);
};

/** ログインボーナスを適用した新しいセーブデータを純粋計算する */
export const applyLoginBonus = (
  save: PlayerSaveData,
  todayKey: string,
  config: LoginBonusConfig = LOGIN_BONUS_CONFIG,
  now: Date = new Date(),
): DomainResult<PlayerSaveData> => {
  const guard = guardLoginBonusClaimable(save, todayKey);
  if (!guard.ok) {
    return guard;
  }

  return ok({
    ...save,
    currencies: {
      magatama: save.currencies.magatama + config.magatama,
      hisui: save.currencies.hisui + config.hisui,
    },
    lastLoginBonusDate: todayKey,
    updatedAt: now.toISOString(),
  });
};
