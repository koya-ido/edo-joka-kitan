import type { LoginBonusConfig } from "@/types";

/** 1日1回（ローカル 0:00 境界）ログインボーナス報酬定義 */
export const LOGIN_BONUS_CONFIG: LoginBonusConfig = Object.freeze({
  magatama: 50,
  hisui: 5,
});
