import { prepareBattleSession, type BattleLaunchContext } from "@/domain";
import {
  BATTLE_FIELD_HEIGHT,
  BATTLE_FIELD_WIDTH,
  createBattleEngine,
  type BattleEngine,
  type BattleViewState,
} from "@/engine";
import { useBattlePersistence } from "@/features/battle/hooks/useBattlePersistence";
import type {
  BattleResultPayload,
  DomainError,
  DomainResult,
  PlayerSaveData,
} from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseBattleEngineOptions {
  readonly onSaveCommitted?: (nextSave: PlayerSaveData) => void;
  readonly onNotifyError?: (error: DomainError) => void;
}

export interface UseBattleEngineResult {
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  readonly launchContext: BattleLaunchContext | null;
  readonly viewState: BattleViewState | null;
  readonly fatalError: string | null;
  readonly isInitializing: boolean;
  readonly isRetreatConfirmOpen: boolean;
  readonly isExiting: boolean;
  readonly isRerolling: boolean;
  readonly isCommitting: boolean;
  readonly committedReward: BattleResultPayload | null;
  readonly commitError: string | null;
  readonly setRetreatConfirmOpen: (open: boolean) => void;
  readonly toggleSpeed: () => void;
  readonly pauseBattle: () => void;
  readonly resumeBattle: () => void;
  readonly selectUpgradeChoice: (optionId: string) => void;
  readonly rerollChoices: () => Promise<void>;
  readonly retryCommitResult: () => Promise<void>;
  readonly retryBattle: () => void;
  readonly confirmExitToStages: (onExit: () => void) => void;
}

export const useBattleEngine = (
  save: PlayerSaveData,
  stageId: string,
  options: UseBattleEngineOptions = {},
): UseBattleEngineResult => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BattleEngine | null>(null);
  const [attemptSeq, setAttemptSeq] = useState(0);
  const stableLaunchRef = useRef<{
    stageId: string;
    attemptSeq: number;
    result: DomainResult<BattleLaunchContext>;
  } | null>(null);

  if (
    !stableLaunchRef.current ||
    stableLaunchRef.current.stageId !== stageId ||
    stableLaunchRef.current.attemptSeq !== attemptSeq
  ) {
    stableLaunchRef.current = {
      stageId,
      attemptSeq,
      result: prepareBattleSession(save, stageId),
    };
  }
  const launchResult = stableLaunchRef.current.result;

  const [viewState, setViewState] = useState<BattleViewState | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isRetreatConfirmOpen, setRetreatConfirmOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const persistence = useBattlePersistence({
    stageId,
    phase: viewState?.hud.phase,
    currentWave: viewState?.hud.currentWave ?? 1,
    rerollCostMagatama: viewState?.hud.rerollCostMagatama ?? 30,
    engineRef,
    onSaveCommitted: options.onSaveCommitted,
    onNotifyError: options.onNotifyError,
  });

  const resetPersistenceRef = useRef(persistence.resetPersistenceState);
  resetPersistenceRef.current = persistence.resetPersistenceState;

  const fatalError = !launchResult.ok
    ? launchResult.error.message
    : runtimeError;

  useEffect(() => {
    if (!launchResult.ok) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = BATTLE_FIELD_WIDTH;
    canvas.height = BATTLE_FIELD_HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setRuntimeError("描画領域（Canvas 2D）の初期化に失敗しました。");
      return;
    }

    resetPersistenceRef.current();

    const engine = createBattleEngine({
      launchContext: launchResult.data,
      callbacks: {
        onViewStateChange: (nextState) => {
          setViewState(nextState);
        },
        onFatalError: (message) => {
          setRuntimeError(message);
        },
      },
    });

    engineRef.current = engine;
    engine.attachCanvas(ctx);
    setViewState(engine.getViewState());
    engine.start();

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, [launchResult]);

  const toggleSpeed = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setGameSpeed(engine.getViewState().hud.gameSpeed === 1 ? 2 : 1);
  }, []);

  const pauseBattle = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const resumeBattle = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const selectUpgradeChoice = useCallback(
    (optionId: string) => {
      if (persistence.isRerolling || persistence.isCommitting) return;
      engineRef.current?.applyUpgradeChoice(optionId);
    },
    [persistence.isRerolling, persistence.isCommitting],
  );

  const retryBattle = useCallback(() => {
    if (isExiting || persistence.isCommitting) return;
    engineRef.current?.stop();
    setRuntimeError(null);
    setViewState(null);
    setAttemptSeq((seq) => seq + 1);
  }, [isExiting, persistence.isCommitting]);

  const confirmExitToStages = useCallback(
    (onExit: () => void) => {
      if (isExiting || persistence.isCommitting) return;
      setIsExiting(true);
      engineRef.current?.stop();
      onExit();
    },
    [isExiting, persistence.isCommitting],
  );

  return {
    canvasRef,
    launchContext: launchResult.ok ? launchResult.data : null,
    viewState,
    fatalError,
    isInitializing:
      launchResult.ok && viewState === null && fatalError === null,
    isRetreatConfirmOpen,
    isExiting,
    isRerolling: persistence.isRerolling,
    isCommitting: persistence.isCommitting,
    committedReward: persistence.committedReward,
    commitError: persistence.commitError,
    setRetreatConfirmOpen,
    toggleSpeed,
    pauseBattle,
    resumeBattle,
    selectUpgradeChoice,
    rerollChoices: persistence.rerollChoices,
    retryCommitResult: persistence.retryCommitResult,
    retryBattle,
    confirmExitToStages,
  };
};
