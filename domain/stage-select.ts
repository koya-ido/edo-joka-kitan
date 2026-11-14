import { STAGE_MASTER_MAP, STAGE_MASTERS } from "@/data";
import { err, ok } from "@/domain/result";
import type { DomainResult, PlayerSaveData, StageMaster } from "@/types";

export type StageProgressStatus = "cleared" | "unverified" | "locked";

export interface StageSelectItem {
  readonly master: StageMaster;
  readonly status: StageProgressStatus;
  readonly isUnlocked: boolean;
  readonly isCleared: boolean;
  readonly isFirstClearBonusAvailable: boolean;
  readonly unlockRequirementName: string | null;
}

export interface BattleSortieContext {
  readonly stage: StageMaster;
  readonly save: PlayerSaveData;
}

/**
 * 403相当ガード: バトル出撃・ルート進入の事前条件を検証する。
 * ステージ存在・解放状態・装備武器（空/未所持）・装備主人公の順で厳格にチェックする。
 */
export const guardBattleSortie = (
  save: PlayerSaveData,
  stageId: string,
  stageMap: Readonly<Record<string, StageMaster>> = STAGE_MASTER_MAP,
): DomainResult<BattleSortieContext> => {
  if (stageId.trim().length === 0 || !Object.hasOwn(stageMap, stageId)) {
    return err("INVALID_STAGE_ID", "指定されたステージは存在しません。");
  }
  if (!save.unlockedStageIds.includes(stageId)) {
    return err("STAGE_LOCKED", "このステージはまだ解放されていません。");
  }
  if (save.equippedWeaponId.trim().length === 0) {
    return err("EMPTY_WEAPON_SELECTION", "持ち込み武器を1つ選択してください。");
  }
  if (!Object.hasOwn(save.ownedWeapons, save.equippedWeaponId)) {
    return err("UNOWNED_WEAPON", "装備中の武器が所持データに見つかりません。");
  }
  if (
    save.equippedCharacterId.trim().length === 0 ||
    !Object.hasOwn(save.ownedCharacters, save.equippedCharacterId)
  ) {
    return err(
      "UNOWNED_CHARACTER",
      "装備中の主人公が所持データに見つかりません。",
    );
  }

  return ok({
    stage: stageMap[stageId],
    save,
  });
};

/**
 * セーブデータとステージマスタから、ステージ選択画面用の表示アイテム一覧を構築する。
 */
export const buildStageSelectItems = (
  save: PlayerSaveData,
  stageMasters: readonly StageMaster[] = STAGE_MASTERS,
  stageMap: Readonly<Record<string, StageMaster>> = STAGE_MASTER_MAP,
): readonly StageSelectItem[] => {
  const sorted = [...stageMasters].sort((a, b) => a.order - b.order);
  return sorted.map((master) => {
    const isCleared = save.clearedStageIds.includes(master.id);
    const isUnlocked = save.unlockedStageIds.includes(master.id);
    const status: StageProgressStatus = isCleared
      ? "cleared"
      : isUnlocked
        ? "unverified"
        : "locked";
    const reqId = master.unlockRequirementStageId;
    const unlockRequirementName =
      reqId !== null && Object.hasOwn(stageMap, reqId)
        ? stageMap[reqId].name
        : null;

    return {
      master,
      status,
      isUnlocked,
      isCleared,
      isFirstClearBonusAvailable: !isCleared && master.firstClearBonusHisui > 0,
      unlockRequirementName,
    };
  });
};
