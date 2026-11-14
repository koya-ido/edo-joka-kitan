import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  BATTLE_FIELD_HEIGHT,
  BATTLE_FIELD_WIDTH,
  type BeamEntity,
  type BellWaveEntity,
  type EnemyEntity,
  type ProjectileEntity,
  type SlashArcEntity,
} from "@/engine/types";
import {
  findNearestEnemy,
  normalizeAngleRad,
} from "@/engine/weapons/weapon-behaviors";

export interface WeaponEffectsUpdateContext {
  readonly dtMs: number;
  readonly enemies: readonly EnemyEntity[];
  readonly projectiles: ProjectileEntity[];
  readonly slashArcs: SlashArcEntity[];
  readonly beams: BeamEntity[];
  readonly bellWaves: BellWaveEntity[];
  readonly onDamageEnemy: (
    enemy: EnemyEntity,
    damage: number,
    isCrit: boolean,
  ) => void;
}

const applyExplosion = (
  centerX: number,
  centerY: number,
  radius: number,
  damage: number,
  isCrit: boolean,
  directTargetId: number,
  enemies: readonly EnemyEntity[],
  onDamageEnemy: WeaponEffectsUpdateContext["onDamageEnemy"],
): void => {
  if (radius <= 0) return;
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || enemy.id === directTargetId) continue;
    const dist = Math.hypot(enemy.x - centerX, enemy.y - centerY);
    if (dist <= radius + enemy.radius) {
      onDamageEnemy(enemy, Math.max(1, Math.round(damage)), isCrit);
    }
  }
};

const updateProjectiles = (ctx: WeaponEffectsUpdateContext): void => {
  const dtSec = ctx.dtMs / 1000;
  for (let i = ctx.projectiles.length - 1; i >= 0; i -= 1) {
    const p = ctx.projectiles[i];
    p.remainingLifeMs -= ctx.dtMs;

    if (p.homingTurnRate > 0) {
      const target = findNearestEnemy(ctx.enemies);
      if (target) {
        const desired = Math.atan2(target.y - p.y, target.x - p.x);
        const current = Math.atan2(p.vy, p.vx);
        const diff = normalizeAngleRad(desired - current);
        const maxTurn = p.homingTurnRate * dtSec;
        const nextAngle = current + Math.max(-maxTurn, Math.min(maxTurn, diff));
        p.vx = Math.cos(nextAngle) * p.speed;
        p.vy = Math.sin(nextAngle) * p.speed;
      }
    }

    p.x += p.vx * dtSec;
    p.y += p.vy * dtSec;

    for (const enemy of ctx.enemies) {
      if (enemy.hp <= 0 || p.hitEnemyIds.has(enemy.id)) continue;
      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist <= enemy.radius + p.radius) {
        p.hitEnemyIds.add(enemy.id);
        ctx.onDamageEnemy(enemy, p.damage, p.isCrit);
        if (p.explosionRadius > 0) {
          applyExplosion(
            p.x,
            p.y,
            p.explosionRadius,
            p.damage * p.splashRatio,
            p.isCrit,
            enemy.id,
            ctx.enemies,
            ctx.onDamageEnemy,
          );
        }
        p.remainingPierce -= 1;
        if (p.remainingPierce <= 0) break;
      }
    }

    const outOfBounds =
      p.x < -40 ||
      p.x > BATTLE_FIELD_WIDTH + 40 ||
      p.y < -40 ||
      p.y > BATTLE_FIELD_HEIGHT + 40;
    if (p.remainingLifeMs <= 0 || p.remainingPierce <= 0 || outOfBounds) {
      ctx.projectiles.splice(i, 1);
    }
  }
};

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
      if (beam.tickTimerMs <= 0) {
        beam.tickTimerMs += beam.tickIntervalMs;
        const dist = Math.hypot(
          target.x - BARRIER_CENTER_X,
          target.y - BARRIER_CENTER_Y,
        );
        if (dist <= beam.range + target.radius) {
          ctx.onDamageEnemy(target, beam.damagePerTick, beam.isCrit);
        }
      }
    }

    if (beam.remainingLifeMs <= 0) {
      ctx.beams.splice(i, 1);
    }
  }
};

const updateBellWaves = (ctx: WeaponEffectsUpdateContext): void => {
  for (let i = ctx.bellWaves.length - 1; i >= 0; i -= 1) {
    const wave = ctx.bellWaves[i];
    wave.remainingLifeMs -= ctx.dtMs;
    const progress = 1 - Math.max(0, wave.remainingLifeMs) / wave.maxLifeMs;
    wave.currentRadius = Math.max(16, wave.maxRadius * progress);

    for (const enemy of ctx.enemies) {
      if (enemy.hp <= 0 || wave.hitEnemyIds.has(enemy.id)) continue;
      const dist = Math.hypot(enemy.x - wave.x, enemy.y - wave.y);
      if (dist <= wave.currentRadius + enemy.radius) {
        wave.hitEnemyIds.add(enemy.id);
        ctx.onDamageEnemy(enemy, wave.damage, wave.isCrit);
      }
    }

    if (wave.remainingLifeMs <= 0) {
      ctx.bellWaves.splice(i, 1);
    }
  }
};

/** すべての発動中武器エフェクト・弾丸を更新する */
export const updateWeaponEffects = (ctx: WeaponEffectsUpdateContext): void => {
  updateProjectiles(ctx);
  updateBeams(ctx);
  updateBellWaves(ctx);

  for (let i = ctx.slashArcs.length - 1; i >= 0; i -= 1) {
    ctx.slashArcs[i].remainingLifeMs -= ctx.dtMs;
    if (ctx.slashArcs[i].remainingLifeMs <= 0) {
      ctx.slashArcs.splice(i, 1);
    }
  }
};
