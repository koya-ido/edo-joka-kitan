import type { TotalMetaStats } from "@/domain";
import type { BattleAudioPort } from "@/engine/audio";
import {
  calculateEffectiveCooldownMs,
  calculateEffectiveDurationMs,
  calculateWeaponDamage,
} from "@/engine/damage";
import type {
  BeamEntity,
  BellWaveEntity,
  EnemyEntity,
  FloatingTextEntity,
  ProjectileEntity,
  ResolvedPassiveBonus,
  SlashArcEntity,
} from "@/engine/types";
import { updateOrbitalWeapon } from "@/engine/weapons/orbital-weapon";
import { updateWeaponEffects } from "@/engine/weapons/resolve-weapon";
import { fireWeaponByGenre } from "@/engine/weapons/weapon-behaviors";
import type {
  InGameBuffState,
  PlayerSaveData,
  WeaponId,
  WeaponMaster,
} from "@/types";

export interface SimulationStepContext {
  readonly dtMs: number;
  readonly save: PlayerSaveData;
  readonly metaStats: TotalMetaStats;
  readonly passive: ResolvedPassiveBonus;
  readonly buffState: InGameBuffState;
  readonly weaponMap: Readonly<Record<WeaponId, WeaponMaster>>;
  readonly audio: BattleAudioPort;
  readonly rng: () => number;
  readonly enemies: EnemyEntity[];
  readonly projectiles: ProjectileEntity[];
  readonly slashArcs: SlashArcEntity[];
  readonly beams: BeamEntity[];
  readonly bellWaves: BellWaveEntity[];
  readonly floatingTexts: FloatingTextEntity[];
  readonly weaponCooldowns: Map<WeaponId, number>;
  readonly orbAngles: Map<WeaponId, number>;
  readonly orbHitCooldowns: Map<WeaponId, Map<number, number>>;
  readonly nextEntityId: () => number;
  readonly onDamageEnemy: (
    enemy: EnemyEntity,
    damage: number,
    isCrit: boolean,
  ) => void;
}

/** 1フレーム分の全解放済み武器の発動・弾道更新・エフェクト寿命更新を実行する */
export const advanceCombatSimulation = (ctx: SimulationStepContext): void => {
  const { dtMs, buffState, weaponMap } = ctx;

  for (const wId of buffState.unlockedWeaponIds) {
    if (!Object.hasOwn(weaponMap, wId)) continue;
    const wMaster = weaponMap[wId];
    const refineLv = Object.hasOwn(ctx.save.ownedWeapons, wId)
      ? ctx.save.ownedWeapons[wId].refineLevel
      : 0;
    const roll = calculateWeaponDamage(
      wMaster,
      refineLv,
      ctx.metaStats,
      buffState,
      ctx.passive,
      ctx.rng,
    );

    if (wMaster.genre === "orb") {
      const cdMap = ctx.orbHitCooldowns.get(wId) ?? new Map<number, number>();
      ctx.orbHitCooldowns.set(wId, cdMap);
      const nextAngle = updateOrbitalWeapon(
        wMaster,
        ctx.orbAngles.get(wId) ?? 0,
        dtMs,
        cdMap,
        ctx.enemies,
        roll.damage,
        roll.isCrit,
        ctx.onDamageEnemy,
      );
      ctx.orbAngles.set(wId, nextAngle);
      continue;
    }

    const rem = (ctx.weaponCooldowns.get(wId) ?? 0) - dtMs;
    if (rem <= 0) {
      const fired = fireWeaponByGenre({
        weapon: wMaster,
        damage: roll.damage,
        isCrit: roll.isCrit,
        durationMs: calculateEffectiveDurationMs(wMaster, buffState),
        enemies: ctx.enemies,
        projectiles: ctx.projectiles,
        slashArcs: ctx.slashArcs,
        beams: ctx.beams,
        bellWaves: ctx.bellWaves,
        nextEntityId: ctx.nextEntityId,
        onDamageEnemy: ctx.onDamageEnemy,
      });
      if (fired) {
        ctx.audio.playWeaponFire(wMaster.genre);
        ctx.weaponCooldowns.set(
          wId,
          calculateEffectiveCooldownMs(wMaster, buffState, ctx.passive),
        );
      } else {
        ctx.weaponCooldowns.set(wId, 0);
      }
    } else {
      ctx.weaponCooldowns.set(wId, rem);
    }
  }

  updateWeaponEffects({
    dtMs,
    enemies: ctx.enemies,
    projectiles: ctx.projectiles,
    slashArcs: ctx.slashArcs,
    beams: ctx.beams,
    bellWaves: ctx.bellWaves,
    onDamageEnemy: ctx.onDamageEnemy,
  });

  for (let i = ctx.enemies.length - 1; i >= 0; i -= 1) {
    if (ctx.enemies[i].hp <= 0) {
      ctx.enemies.splice(i, 1);
    }
  }
  for (let i = ctx.floatingTexts.length - 1; i >= 0; i -= 1) {
    ctx.floatingTexts[i].remainingLifeMs -= dtMs;
    ctx.floatingTexts[i].y -= 24 * (dtMs / 1000);
    if (ctx.floatingTexts[i].remainingLifeMs <= 0) {
      ctx.floatingTexts.splice(i, 1);
    }
  }
};
