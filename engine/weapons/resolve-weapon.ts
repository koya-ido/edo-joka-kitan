import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  type BeamEntity,
  type EnemyEntity,
  type ExplosionEntity,
  type ProjectileEntity,
  type SlashArcEntity,
  type TalismanStrikeEntity,
} from "@/engine/types";
import {
  applyExplosion,
  updateProjectiles,
} from "@/engine/weapons/projectile-effects";
import { findNearestEnemy } from "@/engine/weapons/weapon-behaviors";

export interface WeaponEffectsUpdateContext {
  readonly dtMs: number;
  readonly enemies: readonly EnemyEntity[];
  readonly projectiles: ProjectileEntity[];
  readonly slashArcs: SlashArcEntity[];
  readonly beams: BeamEntity[];
  readonly talismanStrikes?: TalismanStrikeEntity[];
  readonly explosions?: ExplosionEntity[];
  readonly nextEntityId?: () => number;
  readonly rng?: () => number;
  readonly onDamageEnemy: (
    enemy: EnemyEntity,
    damage: number,
    isCrit: boolean,
  ) => void;
}

const MIRROR_CHAIN_RADIUS = 140;

const updateBeams = (ctx: WeaponEffectsUpdateContext): void => {
  for (let i = ctx.beams.length - 1; i >= 0; i -= 1) {
    const beam = ctx.beams[i];
    beam.remainingLifeMs -= ctx.dtMs;
    beam.tickTimerMs -= ctx.dtMs;

    const target =
      ctx.enemies.find((e) => e.id === beam.targetEnemyId && e.hp > 0) ??
      findNearestEnemy(ctx.enemies);
    if (target) {
      beam.endX = target.x;
      beam.endY = target.y;
      const chainTargets =
        beam.bounceRemaining > 0
          ? ctx.enemies
              .filter(
                (e) =>
                  e.hp > 0 &&
                  e.id !== target.id &&
                  Math.hypot(e.x - target.x, e.y - target.y) <=
                    MIRROR_CHAIN_RADIUS + e.radius,
              )
              .slice(0, beam.bounceRemaining)
          : [];
      beam.chainPoints = chainTargets.map((e) => ({ x: e.x, y: e.y }));

      if (beam.tickTimerMs <= 0) {
        beam.tickTimerMs += beam.tickIntervalMs;
        const dist = Math.hypot(
          target.x - BARRIER_CENTER_X,
          target.y - BARRIER_CENTER_Y,
        );
        if (dist <= beam.range + target.radius) {
          ctx.onDamageEnemy(target, beam.damagePerTick, beam.isCrit);
          if (beam.explosionRadius > 0) {
            applyExplosion(
              target.x,
              target.y,
              beam.explosionRadius,
              beam.damagePerTick * 0.6,
              beam.isCrit,
              target.id,
              ctx.enemies,
              ctx.onDamageEnemy,
              ctx.explosions,
              ctx.nextEntityId,
            );
          }
          const chainDmg = Math.max(1, Math.round(beam.damagePerTick * 0.75));
          for (const ct of chainTargets) {
            ctx.onDamageEnemy(ct, chainDmg, beam.isCrit);
          }
        }
      }
    }

    if (beam.remainingLifeMs <= 0) {
      ctx.beams.splice(i, 1);
    }
  }
};

/** すべての発動中武器エフェクト・弾丸を更新する */
export const updateWeaponEffects = (ctx: WeaponEffectsUpdateContext): void => {
  updateProjectiles(ctx);
  updateBeams(ctx);

  for (let i = ctx.slashArcs.length - 1; i >= 0; i -= 1) {
    ctx.slashArcs[i].remainingLifeMs -= ctx.dtMs;
    if (ctx.slashArcs[i].remainingLifeMs <= 0) {
      ctx.slashArcs.splice(i, 1);
    }
  }

  if (ctx.talismanStrikes) {
    for (let i = ctx.talismanStrikes.length - 1; i >= 0; i -= 1) {
      ctx.talismanStrikes[i].remainingLifeMs -= ctx.dtMs;
      if (ctx.talismanStrikes[i].remainingLifeMs <= 0) {
        ctx.talismanStrikes.splice(i, 1);
      }
    }
  }
  if (ctx.explosions) {
    for (let i = ctx.explosions.length - 1; i >= 0; i -= 1) {
      ctx.explosions[i].remainingLifeMs -= ctx.dtMs;
      if (ctx.explosions[i].remainingLifeMs <= 0) {
        ctx.explosions.splice(i, 1);
      }
    }
  }
};
