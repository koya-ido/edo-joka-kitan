import { createInitialPlayerSave } from "@/domain/save-factory";
import { seedPlayerSave } from "@/storage/seed";
import type { DomainResult, PlayerSaveData } from "@/types";

/**
 * Slice 5 テスト・動作確認用:
 * 初期状態（第壱節のみ解放・未浄化、第弐節・第参節は未解放）のセーブを投入する。
 */
export const seedStageInitialStateSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave({
    ...base,
    unlockedStageIds: ["stage_1_bamboo"],
    clearedStageIds: [],
  });
};

/**
 * Slice 5 テスト・動作確認用:
 * 途中進行状態（第壱節浄化済み、第弐節解放・未浄化、第参節未解放）のセーブを投入する。
 */
export const seedStageMidProgressSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave({
    ...base,
    currencies: { magatama: 220, hisui: 12 },
    permanentStats: { hpLevel: 2, atkLevel: 1, lukLevel: 1 },
    unlockedStageIds: ["stage_1_bamboo", "stage_2_old_road"],
    clearedStageIds: ["stage_1_bamboo"],
  });
};

/**
 * Slice 5 テスト・動作確認用:
 * 全3節解放・全3節浄化済み（周回出撃確認用）のセーブを投入する。
 */
export const seedStageAllClearedSave = async (
  now: Date = new Date(),
): Promise<DomainResult<PlayerSaveData>> => {
  const base = createInitialPlayerSave(now);
  return seedPlayerSave({
    ...base,
    currencies: { magatama: 740, hisui: 30 },
    permanentStats: { hpLevel: 5, atkLevel: 4, lukLevel: 3 },
    unlockedStageIds: ["stage_1_bamboo", "stage_2_old_road", "stage_3_shrine"],
    clearedStageIds: ["stage_1_bamboo", "stage_2_old_road", "stage_3_shrine"],
  });
};
