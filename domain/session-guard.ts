import { STAGE_MASTER_MAP } from "@/data";
import { err } from "@/domain/result";
import { validatePlayerSaveData } from "@/domain/save-validator";
import { guardBattleSortie } from "@/domain/stage-select";
import type { DomainResult, PlayerSaveData, StageMaster } from "@/types";

/**
 * 401相当ガード: ローカルセッション（PlayerSaveData）が確立済みかつ
 * ランタイム検証を通過していることを保証する。
 */
export const guardSessionEstablished = (
  save: PlayerSaveData | null | undefined,
): DomainResult<PlayerSaveData> => {
  if (save === null || save === undefined) {
    return err("SAVE_CORRUPTED", "セーブセッションが確立されていません。");
  }
  return validatePlayerSaveData(save);
};

/**
 * 401/403相当ガード: 保護ルートへのアクセス可否を検証する。
 * セッション未確立・破損時は 401 相当（SAVE_CORRUPTED）で拒否し、
 * バトルルート（stageId 指定時）は 403 相当（INVALID_STAGE_ID / STAGE_LOCKED / EMPTY_WEAPON_SELECTION）を検証する。
 */
export const guardProtectedRouteAccess = (
  save: PlayerSaveData | null | undefined,
  stageId?: string,
  stageMap: Readonly<Record<string, StageMaster>> = STAGE_MASTER_MAP,
): DomainResult<PlayerSaveData> => {
  const sessionResult = guardSessionEstablished(save);
  if (!sessionResult.ok) {
    return sessionResult;
  }

  if (stageId !== undefined) {
    const sortieResult = guardBattleSortie(
      sessionResult.data,
      stageId,
      stageMap,
    );
    if (!sortieResult.ok) {
      return sortieResult;
    }
  }

  return sessionResult;
};
