import {
  BATTLE_FIELD_HEIGHT,
  BATTLE_FIELD_WIDTH,
  type EnemyEntity,
  type ExplosionEntity,
  type ProjectileEntity,
} from "@/engine/types";
import {
  findNearestEnemy,
  normalizeAngleRad,
} from "@/engine/weapons/weapon-behaviors";

export interface ProjectileUpdateContext {
  readonly dtMs: number;
  readonly enemies: readonly EnemyEntity[];
  readonly projectiles: ProjectileEntity[];
  readonly explosions?: ExplosionEntity[];
  readonly nextEntityId?: () => number;
  readonly rng?: () => number;
  readonly onDamageEnemy: (
    enemy: EnemyEntity,
    damage: number,
    isCrit: boolean,
  ) => void;
}

const FIELD_MARGIN_PX = 10;

export const applyExplosion = (
  centerX: number,
  centerY: number,
  radius: number,
  damage: number,
  isCrit: boolean,
  directTargetId: number,
  enemies: readonly EnemyEntity[],
  onDamageEnemy: ProjectileUpdateContext["onDamageEnemy"],
  explosions?: ExplosionEntity[],
  nextEntityId?: () => number,
): void => {
  if (radius <= 0) return;
  if (explosions && nextEntityId) {
    explosions.push({
      id: nextEntityId(),
      x: centerX,
      y: centerY,
      radius,
      remainingLifeMs: 260,
      maxLifeMs: 260,
    });
  }
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || enemy.id === directTargetId) continue;
    const dist = Math.hypot(enemy.x - centerX, enemy.y - centerY);
    if (dist <= radius + enemy.radius) {
      onDamageEnemy(enemy, Math.max(1, Math.round(damage)), isCrit);
    }
  }
};

const spawnSplitProjectiles = (
  p: ProjectileEntity,
  hitEnemyId: number,
  ctx: ProjectileUpdateContext,
): void => {
  if (p.splitCount <= 0 || !ctx.nextEntityId) return;
  const rng = ctx.rng ?? Math.random;
  const childDamage = Math.max(1, Math.round(p.damage * 0.5));
  for (let i = 0; i < p.splitCount; i += 1) {
    const angle = rng() * Math.PI * 2;
    ctx.projectiles.push({
      id: ctx.nextEntityId(),
      genre: p.genre,
      colorToken: p.colorToken,
      x: p.x,
      y: p.y,
      vx: Math.cos(angle) * p.speed,
      vy: Math.sin(angle) * p.speed,
      speed: p.speed,
      damage: childDamage,
      isCrit: p.isCrit,
      radius: Math.max(3, p.radius * 0.75),
      visualScale: (p.visualScale ?? 1) * 0.75,
      remainingLifeMs: Math.max(300, Math.round(p.remainingLifeMs * 0.7)),
      remainingPierce: 1 + p.splitPierceBonus,
      explosionRadius: Math.round(p.explosionRadius * 0.7),
      splashRatio: p.splashRatio,
      homingTurnRate: p.homingTurnRate,
      remainingBounces: p.splitBounceBonus,
      splitCount: 0,
      splitPierceBonus: 0,
      splitBounceBonus: 0,
      hitEnemyIds: new Set<number>([hitEnemyId]),
    });
  }
  p.splitCount = 0;
};

const bounceAtEdges = (p: ProjectileEntity): void => {
  if (p.remainingBounces <= 0) return;
  const maxX = BATTLE_FIELD_WIDTH - FIELD_MARGIN_PX;
  const maxY = BATTLE_FIELD_HEIGHT - FIELD_MARGIN_PX;
  let bounced = false;
  if ((p.x <= FIELD_MARGIN_PX && p.vx < 0) || (p.x >= maxX && p.vx > 0)) {
    p.x = Math.max(FIELD_MARGIN_PX, Math.min(maxX, p.x));
    p.vx = -p.vx;
    bounced = true;
  }
  if ((p.y <= FIELD_MARGIN_PX && p.vy < 0) || (p.y >= maxY && p.vy > 0)) {
    p.y = Math.max(FIELD_MARGIN_PX, Math.min(maxY, p.y));
    p.vy = -p.vy;
    bounced = true;
  }
  if (bounced) {
    p.remainingBounces -= 1;
    p.hitEnemyIds.clear();
  }
};

/** 飛翔弾・反射・分裂・爆発の更新処理 */
export const updateProjectiles = (ctx: ProjectileUpdateContext): void => {
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
    bounceAtEdges(p);

    for (const enemy of ctx.enemies) {
      if (enemy.hp <= 0 || p.hitEnemyIds.has(enemy.id)) continue;
      if (Math.hypot(enemy.x - p.x, enemy.y - p.y) <= enemy.radius + p.radius) {
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
            ctx.explosions,
            ctx.nextEntityId,
          );
        }
        spawnSplitProjectiles(p, enemy.id, ctx);
        p.remainingPierce -= 1;
        if (p.remainingPierce <= 0) break;
      }
    }

    const outOfBounds =
      p.x < -40 ||
      p.x > BATTLE_FIELD_WIDTH + 40 ||
      p.y < -40 ||
      p.y > BATTLE_FIELD_HEIGHT + 40;
    const finished = p.remainingPierce <= 0;
    if (finished || outOfBounds) {
      ctx.projectiles.splice(i, 1);
    }
  }
};
