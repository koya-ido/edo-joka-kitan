import type { BattleEngine } from "@/engine";
import { commitBattleResult, rerollBattleChoices } from "@/storage";
import type { BattleResultPayload, DomainError, PlayerSaveData } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseBattlePersistenceOptions {
  readonly stageId: string;
  readonly phase: string | undefined;
  readonly currentWave: number;
  readonly rerollCostMagatama: number;
  readonly engineRef: React.RefObject<BattleEngine | null>;
  readonly onSaveCommitted?: (nextSave: PlayerSaveData) => void;
  readonly onNotifyError?: (error: DomainError) => void;
}

export const useBattlePersistence = ({
  stageId,
  phase,
  currentWave,
  rerollCostMagatama,
  engineRef,
  onSaveCommitted,
  onNotifyError,
}: UseBattlePersistenceOptions) => {
  const hasCommittedResultRef = useRef(false);
  const onSaveCommittedRef = useRef(onSaveCommitted);
  onSaveCommittedRef.current = onSaveCommitted;
  const onNotifyErrorRef = useRef(onNotifyError);
  onNotifyErrorRef.current = onNotifyError;

  const [isRerolling, setIsRerolling] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [committedReward, setCommittedReward] =
    useState<BattleResultPayload | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);

  const resetPersistenceState = useCallback(() => {
    hasCommittedResultRef.current = false;
    setCommittedReward(null);
    setCommitError(null);
  }, []);

  const executeCommitResult = useCallback(
    async (outcome: "victory" | "defeat", reachedWave: number) => {
      setIsCommitting(true);
      setCommitError(null);
      try {
        const res = await commitBattleResult({ stageId, outcome, reachedWave });
        if (res.ok) {
          setCommittedReward(res.data.reward);
          onSaveCommittedRef.current?.(res.data.save);
        } else {
          setCommitError(res.error.message);
        }
      } finally {
        setIsCommitting(false);
      }
    },
    [stageId],
  );

  useEffect(() => {
    if (
      (phase === "victory" || phase === "defeat") &&
      !hasCommittedResultRef.current
    ) {
      hasCommittedResultRef.current = true;
      void executeCommitResult(phase, currentWave);
    }
  }, [phase, currentWave, executeCommitResult]);

  const rerollChoices = useCallback(async () => {
    if (isRerolling || isCommitting) return;
    setIsRerolling(true);
    try {
      const res = await rerollBattleChoices(rerollCostMagatama);
      if (res.ok) {
        onSaveCommittedRef.current?.(res.data);
        engineRef.current?.rerollUpgradeChoices();
      } else {
        onNotifyErrorRef.current?.(res.error);
      }
    } finally {
      setIsRerolling(false);
    }
  }, [isRerolling, isCommitting, rerollCostMagatama, engineRef]);

  const retryCommitResult = useCallback(async () => {
    if (isCommitting) return;
    if (phase === "victory" || phase === "defeat") {
      await executeCommitResult(phase, currentWave);
    }
  }, [isCommitting, phase, currentWave, executeCommitResult]);

  return {
    isRerolling,
    isCommitting,
    committedReward,
    commitError,
    rerollChoices,
    retryCommitResult,
    resetPersistenceState,
  };
};
