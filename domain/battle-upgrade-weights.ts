import type { InGameStatType, InGameUpgradeOption } from "@/types";

export const UPGRADE_TIER_WEIGHTS = Object.freeze({
  weapon_unlock: 10,
  minor_benefit: 5,
  major_benefit: 2,
} as const);

const MAJOR_BENEFIT_STAT_TYPES: ReadonlySet<InGameStatType> = new Set([
  "projectile_plus_2",
  "pierce_plus_2",
  "bounce_plus_2",
  "sword_combo_2",
  "sword_slash_unlock",
  "sword_slash_pierce_2",
  "split_unlock",
  "split_pierce_plus_2",
  "talisman_chain_plus_2",
  "explosion_unlock",
]);

/** 選択肢の種類に応じた出現重みを返す（新武器解放 > 恩恵小 > 恩恵大） */
export const getUpgradeOptionWeight = (option: InGameUpgradeOption): number => {
  if (option.category === "weapon_unlock") {
    return UPGRADE_TIER_WEIGHTS.weapon_unlock;
  }
  if (option.statType && MAJOR_BENEFIT_STAT_TYPES.has(option.statType)) {
    return UPGRADE_TIER_WEIGHTS.major_benefit;
  }
  return UPGRADE_TIER_WEIGHTS.minor_benefit;
};

/** 重み付き非復元抽出で指定数の選択肢をランダムに選出する */
export const sampleWeightedUpgradeOptions = (
  pool: readonly InGameUpgradeOption[],
  choiceCount: number,
  rng: () => number,
): readonly InGameUpgradeOption[] => {
  const remaining = [...pool];
  const selected: InGameUpgradeOption[] = [];
  const targetCount = Math.min(Math.max(1, choiceCount), remaining.length);

  for (let i = 0; i < targetCount; i += 1) {
    let totalWeight = 0;
    for (const item of remaining) {
      totalWeight += getUpgradeOptionWeight(item);
    }
    if (totalWeight <= 0) {
      break;
    }

    let threshold = rng() * totalWeight;
    let chosenIdx = remaining.length - 1;
    for (let j = 0; j < remaining.length; j += 1) {
      threshold -= getUpgradeOptionWeight(remaining[j]);
      if (threshold < 0) {
        chosenIdx = j;
        break;
      }
    }

    selected.push(remaining[chosenIdx]);
    remaining.splice(chosenIdx, 1);
  }

  return selected;
};
