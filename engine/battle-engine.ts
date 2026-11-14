import { WEAPON_MASTER_MAP } from "@/data";
import { createNoopBattleAudio } from "@/engine/audio";
import {
  applyEngineUpgradeChoice,
  buildEngineUpgradeChoices,
  renderEngineFrame,
  unlockEngineWeaponInRun,
} from "@/engine/battle-engine-helpers";
import { advanceCombatSimulation } from "@/engine/battle-simulation";
import {
  applyDamageToEnemy,
  buildViewSignature,
  createInitialBattleState,
  toBattleViewState,
} from "@/engine/battle-state";
import { resolveBattlePalette } from "@/engine/palette";
import {
  advanceWaveSpawns,
  buildWaveSpawnQueue,
  updateEnemiesMovement,
} from "@/engine/spawner";
import {
  PREPARING_DURATION_MS,
  type BattleEngineConfig,
  type BattleViewState,
  type EnemyEntity,
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

  const damageEnemy = (
    enemy: EnemyEntity,
    dmg: number,
    isCrit: boolean,
  ): void => {
    applyDamageToEnemy(state, enemy, dmg, isCrit, audio, nextEntityId);
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
      if (
        state.passive.barrierRegenPerSec > 0 &&
        state.barrierHp < state.barrierMaxHp
      ) {
        state.regenAccumulator +=
          state.passive.barrierRegenPerSec * (dtMs / 1000);
        if (state.regenAccumulator >= 1) {
          const heal = Math.floor(state.regenAccumulator);
          state.regenAccumulator -= heal;
          state.barrierHp = Math.min(
            state.barrierMaxHp,
            state.barrierHp + heal,
          );
        }
      }
      advanceWaveSpawns(state.spawner, dtMs, state.enemies, nextEntityId, rng);
      const barrierDamage = updateEnemiesMovement(state.enemies, dtMs);
      if (barrierDamage > 0)
        state.barrierHp = Math.max(0, state.barrierHp - barrierDamage);
      advanceCombatSimulation({
        dtMs,
        save: launchContext.save,
        metaStats: launchContext.metaStats,
        passive: state.passive,
        buffState: state.buffState,
        weaponMap,
        audio,
        rng,
        enemies: state.enemies,
        projectiles: state.projectiles,
        slashArcs: state.slashArcs,
        beams: state.beams,
        bellWaves: state.bellWaves,
        floatingTexts: state.floatingTexts,
        weaponCooldowns: state.weaponCooldowns,
        orbAngles: state.orbAngles,
        orbHitCooldowns: state.orbHitCooldowns,
        nextEntityId,
        onDamageEnemy: damageEnemy,
      });
      if (state.barrierHp <= 0) {
        audio.playDefeat();
        setPhase("defeat");
        stop();
      } else {
        const isVictory =
          state.spawner.spawnQueue.length === 0 &&
          state.enemies.length === 0 &&
          state.spawner.currentWave >= state.stage.waves.length;

        if (
          state.spawner.spawnQueue.length === 0 &&
          state.enemies.length === 0
        ) {
          if (state.spawner.currentWave < state.stage.waves.length) {
            state.spawner.currentWave += 1;
            state.spawner.spawnQueue = buildWaveSpawnQueue(
              state.stage.waves[state.spawner.currentWave - 1],
            );
            state.spawner.spawnTimerMs = 0;
            audio.playWaveStart(state.spawner.currentWave);
          } else {
            audio.playVictory();
            setPhase("victory");
            stop();
          }
        }

        if (!isVictory && state.pendingLevelUps > 0) {
          state.pendingUpgradeChoices = buildEngineUpgradeChoices(
            state,
            weaponMap,
            rng,
          );
          setPhase("level_up_modal");
        }
      }
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
      const outcome = applyEngineUpgradeChoice(state, optionId, weaponMap, rng);
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
        rng,
      );
      emitViewStateIfChanged(true);
    },
    getViewState: () => toBattleViewState(state),
  };
};
