import type { BattleAudioPort } from "@/engine/audio";
import { advanceCombatSimulation } from "@/engine/battle-simulation";
import {
  applyDamageToEnemy,
  type MutableBattleState,
} from "@/engine/battle-state";
import {
  advanceWaveSpawns,
  buildWaveSpawnQueue,
  updateEnemiesMovement,
} from "@/engine/spawner";
import type { BattleEngineConfig, EnemyEntity } from "@/engine/types";
import type { BattlePhase, WeaponMaster } from "@/types";

export interface StepPlayingContext {
  readonly state: MutableBattleState;
  readonly config: BattleEngineConfig;
  readonly weaponMap: Readonly<Record<string, WeaponMaster>>;
  readonly audio: BattleAudioPort;
  readonly rng: () => number;
  readonly nextEntityId: () => number;
  readonly setPhase: (next: BattlePhase) => void;
  readonly stop: () => void;
  readonly onBuildChoices: () => void;
}

/** 戦闘中（playing）1フレーム分の自然回復・敵進行・戦闘・ウェーブ遷移を実行する */
export const stepPlayingPhase = (
  ctx: StepPlayingContext,
  dtMs: number,
): void => {
  const { state, config, weaponMap, audio, rng, nextEntityId } = ctx;
  const { launchContext } = config;

  if (
    state.passive.barrierRegenPerSec > 0 &&
    state.barrierHp < state.barrierMaxHp
  ) {
    state.regenAccumulator += state.passive.barrierRegenPerSec * (dtMs / 1000);
    if (state.regenAccumulator >= 1) {
      const heal = Math.floor(state.regenAccumulator);
      state.regenAccumulator -= heal;
      state.barrierHp = Math.min(state.barrierMaxHp, state.barrierHp + heal);
    }
  }

  advanceWaveSpawns(state.spawner, dtMs, state.enemies, nextEntityId, rng);
  const barrierDamage = updateEnemiesMovement(state.enemies, dtMs);
  if (barrierDamage > 0) {
    state.barrierHp = Math.max(0, state.barrierHp - barrierDamage);
  }

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
    talismanStrikes: state.talismanStrikes,
    explosions: state.explosions,
    floatingTexts: state.floatingTexts,
    weaponCooldowns: state.weaponCooldowns,
    weaponBursts: state.weaponBursts,
    orbAngles: state.orbAngles,
    orbHitCooldowns: state.orbHitCooldowns,
    nextEntityId,
    onDamageEnemy: (enemy: EnemyEntity, dmg: number, isCrit: boolean) => {
      applyDamageToEnemy(state, enemy, dmg, isCrit, audio, nextEntityId);
    },
  });

  if (state.barrierHp <= 0) {
    audio.playDefeat();
    ctx.setPhase("defeat");
    ctx.stop();
    return;
  }

  const waveCleared =
    state.spawner.spawnQueue.length === 0 && state.enemies.length === 0;
  let isVictory = false;
  if (waveCleared) {
    if (state.spawner.currentWave < state.stage.waves.length) {
      state.spawner.currentWave += 1;
      state.spawner.spawnQueue = buildWaveSpawnQueue(
        state.stage.waves[state.spawner.currentWave - 1],
      );
      state.spawner.spawnTimerMs = 0;
      audio.playWaveStart(state.spawner.currentWave);
    } else {
      isVictory = true;
      audio.playVictory();
      ctx.setPhase("victory");
      ctx.stop();
    }
  }

  if (!isVictory && state.pendingLevelUps > 0) {
    ctx.onBuildChoices();
    ctx.setPhase("level_up_modal");
  }
};
