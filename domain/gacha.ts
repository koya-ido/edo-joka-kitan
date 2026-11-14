import { CHARACTER_MASTERS, GACHA_CONFIG, WEAPON_MASTERS } from "@/data";
import { guardCurrencySufficient } from "@/domain/currency-guard";
import { drawFromPool } from "@/domain/gacha-draw";
import type {
  GachaDropRateEntry,
  GachaExecutionOutput,
  GachaPullCount,
  GachaPullResultItem,
} from "@/domain/gacha-types";
import { err, ok } from "@/domain/result";
import type {
  DomainResult,
  GachaConfig,
  GachaPoolType,
  PlayerSaveData,
} from "@/types";

export type {
  GachaDropRateEntry,
  GachaExecutionOutput,
  GachaPullCount,
  GachaPullResultItem,
} from "@/domain/gacha-types";

/** 召喚回数に応じた必要翡翠数を返す */
export const getGachaCost = (
  count: GachaPullCount,
  config: GachaConfig = GACHA_CONFIG,
): number => (count === 1 ? config.singleCostHisui : config.multiCostHisui);

/** プール種別ごとの提供割合一覧を均等確率で算出する */
export const getGachaDropRates = (
  poolType: GachaPoolType,
): readonly GachaDropRateEntry[] => {
  const pool = poolType === "character" ? CHARACTER_MASTERS : WEAPON_MASTERS;
  const ratePercent = Number((100 / pool.length).toFixed(2));
  return pool.map((entry) => ({
    id: entry.id,
    name: entry.name,
    ratePercent,
  }));
};

/** ガチャ実行前の入力値・通貨残高を検証する（403相当ガード） */
export const guardGachaPullable = (
  save: PlayerSaveData,
  poolType: GachaPoolType,
  count: GachaPullCount,
  config: GachaConfig = GACHA_CONFIG,
): DomainResult<number> => {
  const rawPool: unknown = poolType;
  if (rawPool !== "character" && rawPool !== "weapon") {
    return err("SAVE_CORRUPTED", "不正なガチャプール種別が指定されました。");
  }
  const rawCount: unknown = count;
  if (rawCount !== 1 && rawCount !== config.multiPullCount) {
    return err("SAVE_CORRUPTED", "不正な召喚回数が指定されました。");
  }

  const cost = getGachaCost(count, config);
  const currencyCheck = guardCurrencySufficient(save, "hisui", cost);
  if (!currencyCheck.ok) {
    return currencyCheck;
  }

  return ok(cost);
};

/** 翡翠消費・抽選・重複覚醒精錬・上限勾玉変換を純粋関数として解決する */
export const resolveGachaPulls = (
  save: PlayerSaveData,
  poolType: GachaPoolType,
  count: GachaPullCount,
  rng: () => number = Math.random,
  now: Date = new Date(),
  config: GachaConfig = GACHA_CONFIG,
): DomainResult<GachaExecutionOutput> => {
  const guardResult = guardGachaPullable(save, poolType, count, config);
  if (!guardResult.ok) {
    return guardResult;
  }

  const spentHisui = guardResult.data;
  const nowIso = now.toISOString();
  const nextCharacters = { ...save.ownedCharacters };
  const nextWeapons = { ...save.ownedWeapons };
  const items: GachaPullResultItem[] = [];
  let totalConvertedMagatama = 0;

  for (let i = 0; i < count; i += 1) {
    const item = drawFromPool(
      poolType,
      nextCharacters,
      nextWeapons,
      rng,
      nowIso,
    );
    totalConvertedMagatama += item.convertedMagatama;
    items.push(item);
  }

  return ok({
    nextSave: {
      ...save,
      currencies: {
        hisui: save.currencies.hisui - spentHisui,
        magatama: save.currencies.magatama + totalConvertedMagatama,
      },
      ownedCharacters: nextCharacters,
      ownedWeapons: nextWeapons,
      updatedAt: nowIso,
    },
    items,
    spentHisui,
    totalConvertedMagatama,
  });
};
