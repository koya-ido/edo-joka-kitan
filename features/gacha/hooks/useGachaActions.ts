import { usePlayerSession } from "@/app/session";
import { useAppToast } from "@/components/shared/AppToastProvider";
import type { GachaExecutionOutput, GachaPullCount } from "@/domain";
import { executeGachaPull } from "@/storage";
import type { GachaPoolType } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

const SUMMON_ANIMATION_DURATION_MS = 1200;

export interface GachaActionsState {
  readonly activePool: GachaPoolType;
  readonly setActivePool: (pool: GachaPoolType) => void;
  readonly isPulling: boolean;
  readonly isAnimating: boolean;
  readonly isMutating: boolean;
  readonly pendingResult: GachaExecutionOutput | null;
  readonly resultModalOpen: boolean;
  readonly setResultModalOpen: (open: boolean) => void;
  readonly ratesModalOpen: boolean;
  readonly setRatesModalOpen: (open: boolean) => void;
  readonly handlePull: (
    poolType: GachaPoolType,
    count: GachaPullCount,
  ) => Promise<void>;
  readonly skipAnimation: () => void;
}

export const useGachaActions = (): GachaActionsState => {
  const { applyCommittedSave } = usePlayerSession();
  const { showErrorToast } = useAppToast();

  const [activePool, setActivePool] = useState<GachaPoolType>("character");
  const [isPulling, setIsPulling] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pendingResult, setPendingResult] =
    useState<GachaExecutionOutput | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [ratesModalOpen, setRatesModalOpen] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);

  const clearAnimationTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearAnimationTimer, [clearAnimationTimer]);

  const skipAnimation = useCallback(() => {
    clearAnimationTimer();
    setIsAnimating(false);
    setResultModalOpen(true);
  }, [clearAnimationTimer]);

  const handlePull = useCallback(
    async (poolType: GachaPoolType, count: GachaPullCount) => {
      if (inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;
      setIsPulling(true);

      try {
        const result = await executeGachaPull(poolType, count);
        if (!result.ok) {
          showErrorToast(result.error);
          return;
        }

        applyCommittedSave(result.data.nextSave);
        setPendingResult(result.data);
        setIsAnimating(true);

        clearAnimationTimer();
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          setIsAnimating(false);
          setResultModalOpen(true);
        }, SUMMON_ANIMATION_DURATION_MS);
      } finally {
        setIsPulling(false);
        inFlightRef.current = false;
      }
    },
    [applyCommittedSave, clearAnimationTimer, showErrorToast],
  );

  return {
    activePool,
    setActivePool,
    isPulling,
    isAnimating,
    isMutating: isPulling || isAnimating,
    pendingResult,
    resultModalOpen,
    setResultModalOpen,
    ratesModalOpen,
    setRatesModalOpen,
    handlePull,
    skipAnimation,
  };
};
