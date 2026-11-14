import { WEAPON_MASTER_MAP } from "@/data";
import { createNoopBattleAudio } from "@/engine/audio";
import {
  applyEngineUpgradeChoice,
  buildEngineUpgradeChoices,
  renderEngineFrame,
  unlockEngineWeaponInRun,
} from "@/engine/battle-engine-helpers";
import { stepPlayingPhase } from "@/engine/battle-engine-step";
import {
  buildViewSignature,
  createInitialBattleState,
  toBattleViewState,
} from "@/engine/battle-state";
import { resolveBattlePalette } from "@/engine/palette";
import {
  PREPARING_DURATION_MS,
  type BattleEngineConfig,
  type BattleViewState,
} from "@/engine/types";
import type { BattlePhase, WeaponId } from "@/types";

export interface BattleEngine {
  readonly attachCanvas: (ctx: CanvasRenderingContext2D) => void;
  readonly start: () => void;
  readonly stop: () => void;
  readonly step: (rawDtMs: number) => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly setGameSpeed: (speed: 1 | 2) => void;
  readonly unlockWeaponInRun: (weaponId: WeaponId) => boolean;
  readonly applyUpgradeChoice: (optionId: string) => boolean;
  readonly rerollUpgradeChoices: () => void;
  readonly getViewState: () => BattleViewState;
}

export const createBattleEngine = (
  config: BattleEngineConfig,
): BattleEngine => {
  const { launchContext, callbacks } = config;
  const weaponMap = config.weaponMap ?? WEAPON_MASTER_MAP;
  const ownedWeaponIds = Object.values(weaponMap)
    .filter((w) => Object.hasOwn(launchContext.save.ownedWeapons, w.id))
    .map((w) => w.id);
  const audio = config.audio ?? createNoopBattleAudio();
  const rng = config.rng ?? Math.random;
  const palette = resolveBattlePalette();
  const state = createInitialBattleState(config);

  let rafId: number | null = null;
  let lastFrameTime = 0;
  let canvasCtx: CanvasRenderingContext2D | null = null;
  let lastHudSignature = "";

  const nextEntityId = (): number => {
    const id = state.entitySeq;
    state.entitySeq += 1;
    return id;
  };

  const emitViewStateIfChanged = (force = false): void => {
    const view = toBattleViewState(state);
    const sig = buildViewSignature(view);
    if (force || sig !== lastHudSignature) {
      lastHudSignature = sig;
      callbacks?.onViewStateChange?.(view);
    }
  };

  const setPhase = (next: BattlePhase): void => {
    if (state.phase === next) return;
    state.phase = next;
    callbacks?.onPhaseChange?.(next);
    emitViewStateIfChanged(true);
  };

  const stop = (): void => {
    if (rafId !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(rafId);
    }
    rafId = null;
  };

  const renderCurrentFrame = (): void => {
    renderEngineFrame(canvasCtx, state, weaponMap, palette);
  };

  const step = (rawDtMs: number): void => {
    try {
      const clampedMs = Math.max(0, Math.min(50, rawDtMs));
      if (state.phase === "preparing") {
        state.preparingElapsedMs += clampedMs;
        if (state.preparingElapsedMs >= PREPARING_DURATION_MS) {
          audio.playWaveStart(1);
          setPhase("playing");
        }
        renderCurrentFrame();
        return;
      }
      if (state.phase !== "playing") {
        renderCurrentFrame();
        return;
      }
      const dtMs = clampedMs * state.gameSpeed;
      stepPlayingPhase(
        {
          state,
          config,
          weaponMap,
          audio,
          rng,
          nextEntityId,
          setPhase,
          stop,
          onBuildChoices: () => {
            state.pendingUpgradeChoices = buildEngineUpgradeChoices(
              state,
              weaponMap,
              ownedWeaponIds,
              rng,
            );
          },
        },
        dtMs,
      );
      renderCurrentFrame();
      emitViewStateIfChanged();
    } catch (error) {
      stop();
      console.error("[BattleEngine] Fatal simulation error:", error);
      callbacks?.onFatalError?.("戦闘処理で問題が発生しました。");
    }
  };

  const loop = (now: number): void => {
    const dt = lastFrameTime > 0 ? now - lastFrameTime : 16.67;
    lastFrameTime = now;
    step(dt);
    if (rafId !== null) rafId = requestAnimationFrame(loop);
  };

  return {
    attachCanvas: (ctx) => {
      canvasCtx = ctx;
    },
    start: () => {
      emitViewStateIfChanged(true);
      if (typeof requestAnimationFrame === "function" && rafId === null) {
        lastFrameTime = 0;
        rafId = requestAnimationFrame(loop);
      }
    },
    stop,
    step,
    pause: () => {
      if (state.phase === "playing" || state.phase === "preparing")
        setPhase("paused");
    },
    resume: () => {
      if (state.phase === "paused")
        setPhase(
          state.preparingElapsedMs >= PREPARING_DURATION_MS
            ? "playing"
            : "preparing",
        );
    },
    setGameSpeed: (speed) => {
      state.gameSpeed = speed;
      emitViewStateIfChanged(true);
    },
    unlockWeaponInRun: (weaponId) => {
      const ok = unlockEngineWeaponInRun(state, weaponId, weaponMap);
      if (ok) emitViewStateIfChanged(true);
      return ok;
    },
    applyUpgradeChoice: (optionId) => {
      if (state.phase === "selecting_initial_weapon") {
        const chosen = state.pendingUpgradeChoices.find(
          (c) => c.id === optionId,
        );
        if (!chosen?.targetWeaponId) return false;
        const unlocked = unlockEngineWeaponInRun(
          state,
          chosen.targetWeaponId,
          weaponMap,
        );
        if (!unlocked) return false;
        state.pendingUpgradeChoices = [];
        setPhase("preparing");
        return true;
      }
      const outcome = applyEngineUpgradeChoice(
        state,
        optionId,
        weaponMap,
        ownedWeaponIds,
        rng,
      );
      if (outcome === "invalid") return false;
      if (outcome === "next_level_up") emitViewStateIfChanged(true);
      else setPhase("playing");
      return true;
    },
    rerollUpgradeChoices: () => {
      if (state.phase !== "level_up_modal") return;
      state.pendingUpgradeChoices = buildEngineUpgradeChoices(
        state,
        weaponMap,
        ownedWeaponIds,
        rng,
      );
      emitViewStateIfChanged(true);
    },
    getViewState: () => toBattleViewState(state),
  };
};
