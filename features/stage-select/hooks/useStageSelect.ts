import { useAppToast } from "@/components/shared/AppToastProvider";
import { CHARACTER_MASTER_MAP, STAGE_MASTER_MAP, STAGE_MASTERS } from "@/data";
import {
  buildStageSelectItems,
  guardBattleSortie,
  type StageSelectItem,
} from "@/domain";
import type {
  CharacterMaster,
  DomainError,
  PlayerSaveData,
  StageMaster,
} from "@/types";
import { useCallback, useMemo, useRef, useState } from "react";

export interface UseStageSelectOptions {
  readonly save: PlayerSaveData;
  readonly isSessionPending?: boolean;
  readonly stageMasters?: readonly StageMaster[];
  readonly onNavigate: (to: string) => void;
}

export interface EquippedFormationSummary {
  readonly characterMaster?: CharacterMaster;
  readonly awakeningLevel: number;
}

export interface StageSelectViewState {
  readonly items: readonly StageSelectItem[];
  readonly equippedSummary: EquippedFormationSummary;
  readonly isSortiePending: boolean;
  readonly pendingStageId: string | null;
  readonly sortieError: DomainError | null;
  readonly handleSortie: (stageId: string) => void;
  readonly handleOpenFormation: () => void;
  readonly clearSortieError: () => void;
}

export const useStageSelect = ({
  save,
  isSessionPending = false,
  stageMasters = STAGE_MASTERS,
  onNavigate,
}: UseStageSelectOptions): StageSelectViewState => {
  const { showErrorToast } = useAppToast();
  const [isSortiePending, setIsSortiePending] = useState(false);
  const [pendingStageId, setPendingStageId] = useState<string | null>(null);
  const [sortieError, setSortieError] = useState<DomainError | null>(null);
  const inFlightRef = useRef(false);

  const items = useMemo(
    () => buildStageSelectItems(save, stageMasters, STAGE_MASTER_MAP),
    [save, stageMasters],
  );

  const equippedSummary = useMemo<EquippedFormationSummary>(() => {
    const characterMaster = Object.hasOwn(
      CHARACTER_MASTER_MAP,
      save.equippedCharacterId,
    )
      ? CHARACTER_MASTER_MAP[save.equippedCharacterId]
      : undefined;

    const awakeningLevel =
      characterMaster && Object.hasOwn(save.ownedCharacters, characterMaster.id)
        ? save.ownedCharacters[characterMaster.id].awakeningLevel
        : 0;

    return {
      characterMaster,
      awakeningLevel,
    };
  }, [save]);

  const handleSortie = useCallback(
    (stageId: string) => {
      if (inFlightRef.current || isSortiePending || isSessionPending) {
        return;
      }
      inFlightRef.current = true;
      setIsSortiePending(true);
      setPendingStageId(stageId);
      setSortieError(null);

      const guardResult = guardBattleSortie(save, stageId, STAGE_MASTER_MAP);
      if (!guardResult.ok) {
        setSortieError(guardResult.error);
        showErrorToast(guardResult.error);
        setIsSortiePending(false);
        setPendingStageId(null);
        inFlightRef.current = false;
        return;
      }

      onNavigate(`/battle/${stageId}`);
    },
    [isSortiePending, isSessionPending, save, showErrorToast, onNavigate],
  );

  const handleOpenFormation = useCallback(() => {
    if (inFlightRef.current || isSortiePending || isSessionPending) {
      return;
    }
    onNavigate("/formation?from=stages");
  }, [isSortiePending, isSessionPending, onNavigate]);

  const clearSortieError = useCallback(() => {
    setSortieError(null);
  }, []);

  return {
    items,
    equippedSummary,
    isSortiePending,
    pendingStageId,
    sortieError,
    handleSortie,
    handleOpenFormation,
    clearSortieError,
  };
};
