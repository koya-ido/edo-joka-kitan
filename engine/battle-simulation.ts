import type { TotalMetaStats } from "@/domain";
import type { BattleAudioPort } from "@/engine/audio";
import type { WeaponBurstState } from "@/engine/battle-state";
import {
  calculateEffectiveCooldownMs,
  calculateEffectiveDurationMs,
  calculateWeaponDamage,
} from "@/engine/damage";
import type {
  BeamEntity,
  EnemyEntity,
  ExplosionEntity,
  FloatingTextEntity,
  ProjectileEntity,
  ResolvedPassiveBonus,
  SlashArcEntity,
  TalismanStrikeEntity,
} from "@/engine/types";
import { updateOrbitalWeapon } from "@/engine/weapons/orbital-weapon";
import { updateWeaponEffects } from "@/engine/weapons/resolve-weapon";
import { fireWeaponByGenre } from "@/engine/weapons/weapon-behaviors";
import type {
  InGameBuffState,
  PlayerSaveData,
  WeaponId,
  WeaponMaster,
  WeaponModifierState,
} from "@/types";

const COMBO_BURST_INTERVAL_MS = 110;
const RAPID_FIRE_GENRES = new Set(["bow", "matchlock"]);

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
  readonly talismanStrikes?: TalismanStrikeEntity[];
  readonly explosions?: ExplosionEntity[];
  readonly floatingTexts: FloatingTextEntity[];
  readonly weaponCooldowns: Map<WeaponId, number>;
  readonly weaponBursts?: Map<WeaponId, WeaponBurstState>;
  readonly orbAngles: Map<WeaponId, number>;
  readonly orbHitCooldowns: Map<WeaponId, Map<number, number>>;
  readonly nextEntityId: () => number;
  readonly onDamageEnemy: (
    enemy: EnemyEntity,
    damage: number,
    isCrit: boolean,
  ) => void;
}

const fireWeaponAttack = (
  ctx: SimulationStepContext,
  wMaster: WeaponMaster,
  mod: WeaponModifierState | undefined,
  roll: { readonly damage: number; readonly isCrit: boolean },
): boolean =>
  fireWeaponByGenre({
    weapon: wMaster,
    damage: roll.damage,
    isCrit: roll.isCrit,
    durationMs: calculateEffectiveDurationMs(wMaster, ctx.buffState),
    rangeMultiplier: mod?.rangeMultiplier ?? 1,
    slashWave: mod?.slashWaveEnabled
      ? {
          enabled: true,
          sizeMultiplier: mod.slashWaveSizeMultiplier,
          pierceBonus: mod.slashWavePierceBonus,
        }
      : undefined,
    modifier: mod,
    enemies: ctx.enemies,
    projectiles: ctx.projectiles,
    slashArcs: ctx.slashArcs,
    beams: ctx.beams,
    talismanStrikes: ctx.talismanStrikes,
    explosions: ctx.explosions,
    nextEntityId: ctx.nextEntityId,
    onDamageEnemy: ctx.onDamageEnemy,
  });

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

    const mod = Object.hasOwn(buffState.weaponModifiers, wId)
      ? buffState.weaponModifiers[wId]
      : undefined;

    if (wMaster.genre === "orb") {
      const cdMap = ctx.orbHitCooldowns.get(wId) ?? new Map<number, number>();
      ctx.orbHitCooldowns.set(wId, cdMap);
      ctx.orbAngles.set(
        wId,
        updateOrbitalWeapon(
          wMaster,
          ctx.orbAngles.get(wId) ?? 0,
          dtMs,
          cdMap,
          ctx.enemies,
          roll.damage,
          roll.isCrit,
          ctx.onDamageEnemy,
          mod?.extraProjectiles ?? 0,
          mod?.rangeMultiplier ?? 1,
          mod?.debuffLevel ?? 0,
        ),
      );
      continue;
    }

    const burst = ctx.weaponBursts?.get(wId);
    if (burst && burst.remaining > 0) {
      burst.timerMs -= dtMs;
      if (burst.timerMs <= 0) {
        const burstFired = fireWeaponAttack(ctx, wMaster, mod, roll);
        if (burstFired) ctx.audio.playWeaponFire(wMaster.genre);
        if (burstFired && burst.remaining > 1) {
          burst.remaining -= 1;
          burst.timerMs += COMBO_BURST_INTERVAL_MS;
        } else {
          ctx.weaponBursts?.delete(wId);
          ctx.weaponCooldowns.set(
            wId,
            calculateEffectiveCooldownMs(wMaster, buffState, ctx.passive),
          );
        }
      }
      continue;
    }

    const rem = (ctx.weaponCooldowns.get(wId) ?? 0) - dtMs;
    if (rem <= 0) {
      const fired = fireWeaponAttack(ctx, wMaster, mod, roll);
      if (fired) {
        ctx.audio.playWeaponFire(wMaster.genre);
        const burstCount =
          (mod?.comboBonus ?? 0) +
          (RAPID_FIRE_GENRES.has(wMaster.genre)
            ? (mod?.extraProjectiles ?? 0)
            : 0);
        if (ctx.weaponBursts && burstCount > 0) {
          ctx.weaponBursts.set(wId, {
            remaining: burstCount,
            timerMs: COMBO_BURST_INTERVAL_MS,
          });
        } else {
          ctx.weaponCooldowns.set(
            wId,
            calculateEffectiveCooldownMs(wMaster, buffState, ctx.passive),
          );
        }
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
    talismanStrikes: ctx.talismanStrikes,
    explosions: ctx.explosions,
    nextEntityId: ctx.nextEntityId,
    rng: ctx.rng,
    onDamageEnemy: ctx.onDamageEnemy,
  });

  for (let i = ctx.enemies.length - 1; i >= 0; i -= 1) {
    if (ctx.enemies[i].hp <= 0) ctx.enemies.splice(i, 1);
  }
  for (let i = ctx.floatingTexts.length - 1; i >= 0; i -= 1) {
    ctx.floatingTexts[i].remainingLifeMs -= dtMs;
    ctx.floatingTexts[i].y -= 24 * (dtMs / 1000);
    if (ctx.floatingTexts[i].remainingLifeMs <= 0)
      ctx.floatingTexts.splice(i, 1);
  }
};
