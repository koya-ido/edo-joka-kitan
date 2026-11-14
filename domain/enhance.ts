import { ENHANCE_STAT_CONFIG_MAP, type EnhanceStatKey } from "@/data";
import { guardCurrencySufficient } from "@/domain/currency-guard";
import { err, ok } from "@/domain/result";
import type {
  CharacterMaster,
  DomainResult,
  EnhanceStatConfig,
  PlayerSaveData,
} from "@/types";

/** 基礎値＋キャラ覚醒＋永続強化を合算したメタステータス */
export interface TotalMetaStats {
  readonly hp: number;
  readonly atk: number;
  readonly luk: number;
}

/** 現在レベルから次レベル強化に必要な水晶の勾玉数を算出する */
export const calculateEnhanceCost = (
  config: EnhanceStatConfig,
  currentLevel: number,
): number => {
  const safeLevel =
    Number.isFinite(currentLevel) && currentLevel >= 0
      ? Math.floor(currentLevel)
      : 0;
  return config.baseCostMagatama + safeLevel * config.costStepMagatama;
};

/** 装備キャラクター・覚醒レベル・永続強化レベルの合算基礎ステータスを算出する（加算方式） */
export const calculateTotalMetaStats = (
  save: PlayerSaveData,
  charMaster: CharacterMaster,
  configMap: Readonly<
    Record<EnhanceStatKey, EnhanceStatConfig>
  > = ENHANCE_STAT_CONFIG_MAP,
): TotalMetaStats => {
  const ownedChar = Object.hasOwn(save.ownedCharacters, charMaster.id)
    ? save.ownedCharacters[charMaster.id]
    : undefined;
  const awakeningLevel = ownedChar?.awakeningLevel ?? 0;

  const hp =
    charMaster.baseHp +
    awakeningLevel * charMaster.hpPerAwakening +
    save.permanentStats.hpLevel * configMap.hpLevel.valuePerLevel;

  const atk =
    charMaster.baseAtk +
    awakeningLevel * charMaster.atkPerAwakening +
    save.permanentStats.atkLevel * configMap.atkLevel.valuePerLevel;

  const rawLuk =
    charMaster.baseLuk +
    awakeningLevel * charMaster.lukPerAwakening +
    save.permanentStats.lukLevel * configMap.lukLevel.valuePerLevel;

  return {
    hp,
    atk,
    luk: Number(rawLuk.toFixed(1)),
  };
};

/** 永続強化が実行可能か（最大Lv未到達かつ勾玉残高十分か）を検証する（403相当ガード） */
export const guardEnhanceable = (
  save: PlayerSaveData,
  statKey: EnhanceStatKey,
  maxLevel: number,
  cost: number,
): DomainResult<true> => {
  if (!Object.hasOwn(save.permanentStats, statKey)) {
    return err("SAVE_CORRUPTED", "不正な強化対象が指定されました。");
  }
  const currentLevel = save.permanentStats[statKey];
  if (currentLevel >= maxLevel) {
    return err(
      "ALREADY_MAX_LEVEL",
      "この項目は既に最大強化レベルに達しています。",
    );
  }
  return guardCurrencySufficient(save, "magatama", cost);
};

/** 永続強化を適用した新しいセーブデータをイミュータブルに生成する */
export const applyEnhanceStat = (
  save: PlayerSaveData,
  statKey: EnhanceStatKey,
  configMap: Readonly<
    Record<EnhanceStatKey, EnhanceStatConfig>
  > = ENHANCE_STAT_CONFIG_MAP,
  now: Date = new Date(),
): DomainResult<PlayerSaveData> => {
  if (!Object.hasOwn(configMap, statKey)) {
    return err("SAVE_CORRUPTED", "未知の強化項目が指定されました。");
  }
  const config = configMap[statKey];
  const currentLevel = save.permanentStats[statKey];
  const cost = calculateEnhanceCost(config, currentLevel);

  const guard = guardEnhanceable(save, statKey, config.maxLevel, cost);
  if (!guard.ok) {
    return guard;
  }

  return ok({
    ...save,
    currencies: {
      ...save.currencies,
      magatama: save.currencies.magatama - cost,
    },
    permanentStats: {
      ...save.permanentStats,
      [statKey]: currentLevel + 1,
    },
    updatedAt: now.toISOString(),
  });
};
