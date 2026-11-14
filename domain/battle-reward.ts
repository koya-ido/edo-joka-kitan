import { guardCurrencySufficient } from "@/domain/currency-guard";
import { ok } from "@/domain/result";
import { guardBattleSortie } from "@/domain/stage-select";
import type {
  BattleResultPayload,
  DomainResult,
  PlayerSaveData,
  StageId,
  StageMaster,
} from "@/types";

export const WAVE_RESCUE_MAGATAMA = 8 as const;
export const DEFAULT_BATTLE_REROLL_COST = 30 as const;

export interface CalculateBattleRewardsInput {
  readonly save: PlayerSaveData;
  readonly stage: StageMaster;
  readonly outcome: "victory" | "defeat";
  readonly reachedWave: number;
  readonly allStages: readonly StageMaster[];
}

export interface CommitBattleResultInput {
  readonly stageId: StageId;
  readonly outcome: "victory" | "defeat";
  readonly reachedWave: number;
}

export interface AppliedBattleResult {
  readonly save: PlayerSaveData;
  readonly reward: BattleResultPayload;
}

const appendUniqueStageId = (
  list: readonly StageId[],
  stageId: StageId,
): StageId[] => (list.includes(stageId) ? [...list] : [...list, stageId]);

/**
 * 勝敗・到達ウェーブ・初回クリア状態からバトル報酬と次節解放を算出する。
 */
export const calculateBattleRewards = (
  input: CalculateBattleRewardsInput,
): BattleResultPayload => {
  const { save, stage, outcome, reachedWave, allStages } = input;
  const totalWaves = stage.waves.length;

  if (outcome === "victory") {
    const isFirstClear = !save.clearedStageIds.includes(stage.id);
    const earnedMagatama = stage.clearReward.magatama;
    const earnedHisui =
      stage.clearReward.hisui + (isFirstClear ? stage.firstClearBonusHisui : 0);
    const nextStage =
      allStages.find((s) => s.unlockRequirementStageId === stage.id) ?? null;
    const newlyUnlockedStageId =
      nextStage && !save.unlockedStageIds.includes(nextStage.id)
        ? nextStage.id
        : null;

    return {
      stageId: stage.id,
      outcome: "victory",
      reachedWave: totalWaves,
      earnedMagatama,
      earnedHisui,
      newlyUnlockedStageId,
    };
  }

  const safeWave = Math.max(
    1,
    Math.min(
      totalWaves,
      Math.floor(Number.isFinite(reachedWave) ? reachedWave : 1),
    ),
  );
  return {
    stageId: stage.id,
    outcome: "defeat",
    reachedWave: safeWave,
    earnedMagatama: safeWave * WAVE_RESCUE_MAGATAMA,
    earnedHisui: 0,
    newlyUnlockedStageId: null,
  };
};

/**
 * 勾玉を消費してバトル中3択リロールを許可・適用する（403相当ガード付き）。
 */
export const applyBattleRerollCost = (
  save: PlayerSaveData,
  costMagatama: number = DEFAULT_BATTLE_REROLL_COST,
  now: Date = new Date(),
): DomainResult<PlayerSaveData> => {
  const guard = guardCurrencySufficient(save, "magatama", costMagatama);
  if (!guard.ok) {
    return guard;
  }
  return ok({
    ...save,
    currencies: {
      ...save.currencies,
      magatama: save.currencies.magatama - costMagatama,
    },
    updatedAt: now.toISOString(),
  });
};

/**
 * 出撃・解放整合性を検証した上で、バトル報酬・クリア状態・次節解放をセーブへ適用する。
 */
export const applyBattleResultToSave = (
  save: PlayerSaveData,
  input: CommitBattleResultInput,
  stageMap: Readonly<Record<StageId, StageMaster>>,
  allStages: readonly StageMaster[],
  now: Date = new Date(),
): DomainResult<AppliedBattleResult> => {
  const sortieGuard = guardBattleSortie(save, input.stageId, stageMap);
  if (!sortieGuard.ok) {
    return sortieGuard;
  }

  const stage = stageMap[input.stageId];
  const reward = calculateBattleRewards({
    save,
    stage,
    outcome: input.outcome,
    reachedWave: input.reachedWave,
    allStages,
  });

  const nextClearedStageIds =
    input.outcome === "victory"
      ? appendUniqueStageId(save.clearedStageIds, stage.id)
      : [...save.clearedStageIds];

  const nextUnlockedStageIds =
    reward.newlyUnlockedStageId !== null
      ? appendUniqueStageId(save.unlockedStageIds, reward.newlyUnlockedStageId)
      : [...save.unlockedStageIds];

  const nextSave: PlayerSaveData = {
    ...save,
    currencies: {
      magatama: save.currencies.magatama + reward.earnedMagatama,
      hisui: save.currencies.hisui + reward.earnedHisui,
    },
    clearedStageIds: nextClearedStageIds,
    unlockedStageIds: nextUnlockedStageIds,
    updatedAt: now.toISOString(),
  };

  return ok({ save: nextSave, reward });
};
