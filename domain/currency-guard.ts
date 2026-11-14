import { err, ok } from "@/domain/result";
import type { CurrencyType, DomainResult, PlayerSaveData } from "@/types";

/**
 * 指定通貨の残高がコスト以上であるかを検証する（403相当ガード）。
 * 不正コスト（負数・非整数・NaN）または残高不足時はエラーを返却する。
 */
export const guardCurrencySufficient = (
  save: PlayerSaveData,
  currencyType: CurrencyType,
  cost: number,
): DomainResult<true> => {
  const isValidCost =
    typeof cost === "number" &&
    Number.isFinite(cost) &&
    Number.isInteger(cost) &&
    cost >= 0;

  if (!isValidCost || save.currencies[currencyType] < cost) {
    if (currencyType === "magatama") {
      return err("INSUFFICIENT_MAGATAMA", "水晶の勾玉が不足しています。");
    }
    return err("INSUFFICIENT_HISUI", "翡翠が不足しています。");
  }

  return ok(true);
};
