import type { EnhanceStatConfig } from "@/types";

/** 永続強化対象のパラメータキー */
export type EnhanceStatKey = EnhanceStatConfig["statKey"];

/** 永続基礎ステータス強化マスタ定義（不変） */
export const ENHANCE_STAT_CONFIGS: readonly EnhanceStatConfig[] = Object.freeze(
  [
    {
      statKey: "hpLevel",
      label: "結界耐久",
      valuePerLevel: 20,
      baseCostMagatama: 20,
      costStepMagatama: 10,
      maxLevel: 20,
    },
    {
      statKey: "atkLevel",
      label: "霊力攻撃",
      valuePerLevel: 3,
      baseCostMagatama: 25,
      costStepMagatama: 15,
      maxLevel: 20,
    },
    {
      statKey: "lukLevel",
      label: "会心発生率",
      valuePerLevel: 1,
      baseCostMagatama: 30,
      costStepMagatama: 20,
      maxLevel: 15,
    },
  ],
);

/** statKey で O(1) 参照するための永続強化マスタマップ */
export const ENHANCE_STAT_CONFIG_MAP: Readonly<
  Record<EnhanceStatKey, EnhanceStatConfig>
> = Object.freeze(
  Object.fromEntries(
    ENHANCE_STAT_CONFIGS.map((config) => [config.statKey, config]),
  ) as Record<EnhanceStatKey, EnhanceStatConfig>,
);
