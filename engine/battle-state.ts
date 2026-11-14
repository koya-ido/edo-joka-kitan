import type { BattleAudioPort } from "@/engine/audio";
import {
  calculateExpToNextLevel,
  resolveCharacterPassive,
} from "@/engine/damage";
import { buildWaveSpawnQueue, type WaveSpawnerState } from "@/engine/spawner";
import {
  DEFAULT_REROLL_COST_MAGATAMA,
  type BattleEngineConfig,
  type BattleViewState,
  type BeamEntity,
  type BellWaveEntity,
  type EnemyEntity,
  type FloatingTextEntity,
  type ProjectileEntity,
  type ResolvedPassiveBonus,
  type SlashArcEntity,
} from "@/engine/types";
import type {
  BattlePhase,
  InGameBuffState,
  StageMaster,
  WeaponId,
  WeaponModifierState,
} from "@/types";

export interface MutableBattleState {
  phase: BattlePhase;
  preparingElapsedMs: number;
  gameSpeed: 1 | 2;
  barrierHp: number;
  readonly barrierMaxHp: number;
  level: number;
  exp: number;
  expToNextLevel: number;
  readonly stage: StageMaster;
  readonly passive: ResolvedPassiveBonus;
  readonly buffState: InGameBuffState;
  readonly spawner: WaveSpawnerState;
  readonly enemies: EnemyEntity[];
  readonly projectiles: ProjectileEntity[];
  readonly slashArcs: SlashArcEntity[];
  readonly beams: BeamEntity[];
  readonly bellWaves: BellWaveEntity[];
  readonly floatingTexts: FloatingTextEntity[];
  readonly weaponCooldowns: Map<WeaponId, number>;
  readonly orbAngles: Map<WeaponId, number>;
  readonly orbHitCooldowns: Map<WeaponId, Map<number, number>>;
  regenAccumulator: number;
  entitySeq: number;
}

export const createInitialBattleState = (
  config: BattleEngineConfig,
): MutableBattleState => {
  const { launchContext } = config;
  const stage = config.stageOverride ?? launchContext.stage;
  const weaponId = launchContext.weapon.id;

  return {
    phase: "preparing",
    preparingElapsedMs: 0,
    gameSpeed: 1,
    barrierHp: launchContext.metaStats.hp,
    barrierMaxHp: launchContext.metaStats.hp,
    level: 1,
    exp: 0,
    expToNextLevel: calculateExpToNextLevel(1),
    stage,
    passive: resolveCharacterPassive(
      launchContext.character,
      launchContext.ownedCharacter.awakeningLevel,
    ),
    buffState: {
      atkMultiplier: 1,
      critRateBonusPct: 0,
      critDamageMultiplier: 1.5,
      unlockedWeaponIds: [weaponId],
      weaponModifiers: {
        [weaponId]: {
          damageMultiplier: 1,
          cooldownMultiplier: 1,
          durationMultiplier: 1,
        },
      } as Record<WeaponId, WeaponModifierState>,
    },
    spawner: {
      currentWave: 1,
      spawnQueue: buildWaveSpawnQueue(stage.waves[0]),
      spawnTimerMs: 0,
    },
    enemies: [],
    projectiles: [],
    slashArcs: [],
    beams: [],
    bellWaves: [],
    floatingTexts: [],
    weaponCooldowns: new Map<WeaponId, number>([[weaponId, 0]]),
    orbAngles: new Map<WeaponId, number>(),
    orbHitCooldowns: new Map<WeaponId, Map<number, number>>(),
    regenAccumulator: 0,
    entitySeq: 1,
  };
};

export const toBattleViewState = (
  state: MutableBattleState,
): BattleViewState => ({
  hud: {
    phase: state.phase,
    stageId: state.stage.id,
    currentWave: state.spawner.currentWave,
    totalWaves: state.stage.waves.length,
    barrierHp: Math.ceil(Math.max(0, state.barrierHp)),
    barrierMaxHp: state.barrierMaxHp,
    level: state.level,
    exp: Math.floor(state.exp),
    expToNextLevel: state.expToNextLevel,
    gameSpeed: state.gameSpeed,
    rerollCostMagatama: DEFAULT_REROLL_COST_MAGATAMA,
    pendingUpgradeChoices: [],
  },
  buffState: {
    ...state.buffState,
    unlockedWeaponIds: [...state.buffState.unlockedWeaponIds],
  },
  activeEnemyCount: state.enemies.length,
});

export const buildViewSignature = (view: BattleViewState): string =>
  [
    view.hud.phase,
    String(view.hud.currentWave),
    String(view.hud.barrierHp),
    String(view.hud.level),
    String(view.hud.exp),
    String(view.hud.gameSpeed),
    String(view.buffState.unlockedWeaponIds.length),
  ].join(":");

export const applyDamageToEnemy = (
  state: MutableBattleState,
  enemy: EnemyEntity,
  dmg: number,
  isCrit: boolean,
  audio: BattleAudioPort,
  nextEntityId: () => number,
): void => {
  if (enemy.hp <= 0) return;
  enemy.hp -= dmg;
  enemy.hitFlashMs = 90;
  audio.playHit(isCrit);
  state.floatingTexts.push({
    id: nextEntityId(),
    x: enemy.x,
    y: enemy.y - enemy.radius,
    text: isCrit ? `${String(dmg)}!` : String(dmg),
    isCrit,
    isHeal: false,
    remainingLifeMs: 550,
    maxLifeMs: 550,
  });
  if (enemy.hp <= 0) {
    state.exp += enemy.expReward * state.passive.expMultiplier;
    while (state.exp >= state.expToNextLevel) {
      state.exp -= state.expToNextLevel;
      state.level += 1;
      state.expToNextLevel = calculateExpToNextLevel(state.level);
      audio.playLevelUp();
    }
  }
};
