import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  type BeamEntity,
  type BeamSegment,
  type EnemyEntity,
  type ExplosionEntity,
  type ProjectileEntity,
  type SlashArcEntity,
  type TalismanStrikeEntity,
} from "@/engine/types";
import {
  computeWallBounceSegments,
  pointToSegmentDistance,
} from "@/engine/weapons/beam-geometry";
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

const BEAM_HALF_WIDTH = 6;

const updateBeams = (ctx: WeaponEffectsUpdateContext): void => {
  for (let i = ctx.beams.length - 1; i >= 0; i -= 1) {
    const beam = ctx.beams[i];
    beam.remainingLifeMs -= ctx.dtMs;
    beam.tickTimerMs -= ctx.dtMs;

    const target =
      ctx.enemies.find((e) => e.id === beam.targetEnemyId && e.hp > 0) ??
      findNearestEnemy(ctx.enemies);
    if (target) {
      const baseAngle = Math.atan2(
        target.y - BARRIER_CENTER_Y,
        target.x - BARRIER_CENTER_X,
      );
      const segments = computeWallBounceSegments(
        BARRIER_CENTER_X,
        BARRIER_CENTER_Y,
        baseAngle + (beam.angleOffsetRad ?? 0),
        beam.bounceRemaining,
      );
      beam.segments = segments;
      const lastSeg = segments[segments.length - 1];
      beam.endX = lastSeg.x2;
      beam.endY = lastSeg.y2;
    }

    if (beam.tickTimerMs <= 0) {
      beam.tickTimerMs += beam.tickIntervalMs;
      const segments: readonly BeamSegment[] = beam.segments ?? [
        {
          x1: BARRIER_CENTER_X,
          y1: BARRIER_CENTER_Y,
          x2: beam.endX,
          y2: beam.endY,
        },
      ];
      const hitEnemyIds = new Set<number>();
      const halfWidth = BEAM_HALF_WIDTH * (beam.widthMultiplier ?? 1);
      for (const seg of segments) {
        for (const enemy of ctx.enemies) {
          if (enemy.hp <= 0 || hitEnemyIds.has(enemy.id)) continue;
          const dist = pointToSegmentDistance(
            enemy.x,
            enemy.y,
            seg.x1,
            seg.y1,
            seg.x2,
            seg.y2,
          );
          if (dist <= enemy.radius + halfWidth) {
            hitEnemyIds.add(enemy.id);
            ctx.onDamageEnemy(enemy, beam.damagePerTick, beam.isCrit);
            if (beam.explosionRadius > 0) {
              applyExplosion(
                enemy.x,
                enemy.y,
                beam.explosionRadius,
                beam.damagePerTick * 0.6,
                beam.isCrit,
                enemy.id,
                ctx.enemies,
                ctx.onDamageEnemy,
                ctx.explosions,
                ctx.nextEntityId,
              );
            }
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
