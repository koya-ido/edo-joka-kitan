import {
  createDefaultWeaponModifier,
  generateInitialWeaponChoices,
} from "@/domain";
import type { BattleAudioPort } from "@/engine/audio";
import {
  calculateExpToNextLevel,
  resolveCharacterPassive,
} from "@/engine/damage";
import {
  spawnHitSparkParticles,
  spawnPurificationParticles,
  triggerScreenShake,
} from "@/engine/particles";
import { buildWaveSpawnQueue, type WaveSpawnerState } from "@/engine/spawner";
import {
  DEFAULT_REROLL_COST_MAGATAMA,
  type BattleEngineConfig,
  type BattleViewState,
  type BeamEntity,
  type EnemyEntity,
  type ExplosionEntity,
  type FloatingTextEntity,
  type ParticleEntity,
  type ProjectileEntity,
  type ResolvedPassiveBonus,
  type SlashArcEntity,
  type TalismanStrikeEntity,
} from "@/engine/types";
import type {
  BattlePhase,
  InGameBuffState,
  InGameUpgradeOption,
  StageMaster,
  WeaponId,
  WeaponModifierState,
} from "@/types";

export interface WeaponBurstState {
  remaining: number;
  timerMs: number;
}

export interface MutableBattleState {
  phase: BattlePhase;
  preparingElapsedMs: number;
  gameSpeed: 1 | 2;
  barrierHp: number;
  readonly barrierMaxHp: number;
  level: number;
  exp: number;
  expToNextLevel: number;
  pendingLevelUps: number;
  pendingUpgradeChoices: readonly InGameUpgradeOption[];
  readonly stage: StageMaster;
  readonly passive: ResolvedPassiveBonus;
  buffState: InGameBuffState;
  readonly spawner: WaveSpawnerState;
  readonly enemies: EnemyEntity[];
  readonly projectiles: ProjectileEntity[];
  readonly slashArcs: SlashArcEntity[];
  readonly beams: BeamEntity[];
  readonly talismanStrikes: TalismanStrikeEntity[];
  readonly explosions: ExplosionEntity[];
  readonly particles: ParticleEntity[];
  readonly floatingTexts: FloatingTextEntity[];
  readonly weaponCooldowns: Map<WeaponId, number>;
  readonly weaponBursts: Map<WeaponId, WeaponBurstState>;
  readonly orbAngles: Map<WeaponId, number>;
  readonly orbHitCooldowns: Map<WeaponId, Map<number, number>>;
  regenAccumulator: number;
  elapsedMs: number;
  shakeRemainingMs: number;
  shakeIntensity: number;
  barrierHitPulseMs: number;
  entitySeq: number;
}

export const createInitialBattleState = (
  config: BattleEngineConfig,
): MutableBattleState => {
  const { launchContext } = config;
  const stage = config.stageOverride ?? launchContext.stage;
  const rng = config.rng ?? Math.random;
  const ownedWeapons = launchContext.ownedWeaponList.map(
    (entry) => entry.master,
  );
  const isSingleWeapon = ownedWeapons.length <= 1;
  const initialWeaponId = isSingleWeapon ? ownedWeapons[0]?.id : undefined;
  const initialChoices = isSingleWeapon
    ? []
    : generateInitialWeaponChoices(ownedWeapons, rng, 3);
  const initialWeaponModifiers = (
    initialWeaponId ? { [initialWeaponId]: createDefaultWeaponModifier() } : {}
  ) as Record<WeaponId, WeaponModifierState>;
  const initialCooldowns = initialWeaponId
    ? new Map<WeaponId, number>([[initialWeaponId, 0]])
    : new Map<WeaponId, number>();

  return {
    phase: isSingleWeapon ? "preparing" : "selecting_initial_weapon",
    preparingElapsedMs: 0,
    gameSpeed: 1,
    barrierHp: launchContext.metaStats.hp,
    barrierMaxHp: launchContext.metaStats.hp,
    level: 1,
    exp: 0,
    expToNextLevel: calculateExpToNextLevel(1),
    pendingLevelUps: 0,
    pendingUpgradeChoices: initialChoices,
    stage,
    passive: resolveCharacterPassive(
      launchContext.character,
      launchContext.ownedCharacter.awakeningLevel,
    ),
    buffState: {
      atkMultiplier: 1,
      critRateBonusPct: 0,
      critDamageMultiplier: 1.5,
      unlockedWeaponIds: initialWeaponId ? [initialWeaponId] : [],
      weaponModifiers: initialWeaponModifiers,
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
    talismanStrikes: [],
    explosions: [],
    particles: [],
    floatingTexts: [],
    weaponCooldowns: initialCooldowns,
    weaponBursts: new Map<WeaponId, WeaponBurstState>(),
    orbAngles: new Map<WeaponId, number>(),
    orbHitCooldowns: new Map<WeaponId, Map<number, number>>(),
    regenAccumulator: 0,
    elapsedMs: 0,
    shakeRemainingMs: 0,
    shakeIntensity: 0,
    barrierHitPulseMs: 0,
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
    pendingUpgradeChoices: state.pendingUpgradeChoices,
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
    view.hud.pendingUpgradeChoices.map((c) => c.id).join(","),
  ].join(":");

export const applyDamageToEnemy = (
  state: MutableBattleState,
  enemy: EnemyEntity,
  dmg: number,
  isCrit: boolean,
  audio: BattleAudioPort,
  nextEntityId: () => number,
  rng: () => number = Math.random,
): void => {
  if (enemy.hp <= 0) return;
  const vulnMult =
    enemy.vulnerableRemainingMs && enemy.vulnerableRemainingMs > 0
      ? (enemy.vulnerableMultiplier ?? 1)
      : 1;
  const finalDmg = Math.max(1, Math.round(dmg * vulnMult));
  enemy.hp -= finalDmg;
  enemy.hitFlashMs = 90;
  audio.playHit(isCrit);
  spawnHitSparkParticles(
    state.particles,
    enemy.x,
    enemy.y,
    isCrit,
    nextEntityId,
    rng,
  );
  if (isCrit) triggerScreenShake(state, 2.5, 90);
  state.floatingTexts.push({
    id: nextEntityId(),
    x: enemy.x,
    y: enemy.y - enemy.radius,
    text: isCrit ? `${String(finalDmg)}!` : String(finalDmg),
    isCrit,
    isHeal: false,
    remainingLifeMs: 550,
    maxLifeMs: 550,
  });
  if (enemy.hp <= 0) {
    spawnPurificationParticles(
      state.particles,
      enemy.x,
      enemy.y,
      enemy.isBoss,
      nextEntityId,
      rng,
    );
    if (enemy.isBoss) triggerScreenShake(state, 8, 320);
    state.exp += enemy.expReward * state.passive.expMultiplier;
    while (state.exp >= state.expToNextLevel) {
      state.exp -= state.expToNextLevel;
      state.level += 1;
      state.pendingLevelUps += 1;
      state.expToNextLevel = calculateExpToNextLevel(state.level);
      audio.playLevelUp();
    }
  }
};
