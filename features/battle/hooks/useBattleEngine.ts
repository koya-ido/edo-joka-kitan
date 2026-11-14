import { prepareBattleSession, type BattleLaunchContext } from "@/domain";
import {
  BATTLE_FIELD_HEIGHT,
  BATTLE_FIELD_WIDTH,
  createBattleEngine,
  type BattleEngine,
  type BattleViewState,
} from "@/engine";
import type { PlayerSaveData } from "@/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseBattleEngineResult {
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  readonly launchContext: BattleLaunchContext | null;
  readonly viewState: BattleViewState | null;
  readonly fatalError: string | null;
  readonly isInitializing: boolean;
  readonly isRetreatConfirmOpen: boolean;
  readonly isExiting: boolean;
  readonly setRetreatConfirmOpen: (open: boolean) => void;
  readonly toggleSpeed: () => void;
  readonly pauseBattle: () => void;
  readonly resumeBattle: () => void;
  readonly confirmExitToStages: (onExit: () => void) => void;
}

export const useBattleEngine = (
  save: PlayerSaveData,
  stageId: string,
): UseBattleEngineResult => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BattleEngine | null>(null);

  const launchResult = useMemo(
    () => prepareBattleSession(save, stageId),
    [save, stageId],
  );

  const [viewState, setViewState] = useState<BattleViewState | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isRetreatConfirmOpen, setRetreatConfirmOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const fatalError = !launchResult.ok
    ? launchResult.error.message
    : runtimeError;

  useEffect(() => {
    if (!launchResult.ok) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.width = BATTLE_FIELD_WIDTH;
    canvas.height = BATTLE_FIELD_HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setRuntimeError("描画領域（Canvas 2D）の初期化に失敗しました。");
      return;
    }

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
    const current = engine.getViewState().hud.gameSpeed;
    engine.setGameSpeed(current === 1 ? 2 : 1);
  }, []);

  const pauseBattle = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const resumeBattle = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const confirmExitToStages = useCallback(
    (onExit: () => void) => {
      if (isExiting) return;
      setIsExiting(true);
      engineRef.current?.stop();
      onExit();
    },
    [isExiting],
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
    setRetreatConfirmOpen,
    toggleSpeed,
    pauseBattle,
    resumeBattle,
    confirmExitToStages,
  };
};
