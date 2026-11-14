import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  readGenreParam,
  type BeamEntity,
  type EnemyEntity,
  type ExplosionEntity,
  type ProjectileEntity,
  type SlashArcEntity,
  type TalismanStrikeEntity,
} from "@/engine/types";
import { applyEnemyDebuff } from "@/engine/weapons/debuff";
import { applyExplosion } from "@/engine/weapons/projectile-effects";
import type { WeaponMaster, WeaponModifierState } from "@/types";

export interface SwordSlashWaveConfig {
  readonly enabled: boolean;
  readonly sizeMultiplier: number;
  readonly pierceBonus: number;
}

export interface WeaponFireContext {
  readonly weapon: WeaponMaster;
  readonly damage: number;
  readonly isCrit: boolean;
  readonly durationMs: number;
  readonly rangeMultiplier?: number;
  readonly slashWave?: SwordSlashWaveConfig;
  readonly modifier?: WeaponModifierState;
  readonly enemies: readonly EnemyEntity[];
  readonly projectiles: ProjectileEntity[];
  readonly slashArcs: SlashArcEntity[];
  readonly beams: BeamEntity[];
  readonly talismanStrikes?: TalismanStrikeEntity[];
  readonly explosions?: ExplosionEntity[];
  readonly nextEntityId: () => number;
  readonly onDamageEnemy: (
    enemy: EnemyEntity,
    damage: number,
    isCrit: boolean,
  ) => void;
}

/** 角度を [-PI, PI] へ正規化する */
export const normalizeAngleRad = (angle: number): number => {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

/** 守護結界に最も近い生存中の妖怪を取得する */
export const findNearestEnemy = (
  enemies: readonly EnemyEntity[],
): EnemyEntity | null => {
  let nearest: EnemyEntity | null = null;
  let minDistSq = Number.POSITIVE_INFINITY;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const dx = enemy.x - BARRIER_CENTER_X;
    const dy = enemy.y - BARRIER_CENTER_Y;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDistSq) {
      minDistSq = distSq;
      nearest = enemy;
    }
  }
  return nearest;
};

export interface ProjectileOptions {
  readonly radius?: number;
  readonly speed?: number;
  readonly lifeMs?: number;
  readonly pierce?: number;
  readonly explosionRadius?: number;
  readonly splashRatio?: number;
  readonly homingTurnRate?: number;
  readonly remainingBounces?: number;
  readonly splitCount?: number;
  readonly splitPierceBonus?: number;
  readonly splitBounceBonus?: number;
}

/** 飛翔弾・呪符・火縄弾・斬撃波エンティティを生成する */
export const createProjectile = (
  ctx: WeaponFireContext,
  angleRad: number,
  opts: ProjectileOptions = {},
): ProjectileEntity => {
  const speed = Math.max(120, opts.speed ?? ctx.weapon.projectileSpeed);
  return {
    id: ctx.nextEntityId(),
    genre: ctx.weapon.genre,
    colorToken: ctx.weapon.colorToken,
    x: BARRIER_CENTER_X,
    y: BARRIER_CENTER_Y,
    vx: Math.cos(angleRad) * speed,
    vy: Math.sin(angleRad) * speed,
    speed,
    damage: ctx.damage,
    isCrit: ctx.isCrit,
    radius: opts.radius ?? 6,
    remainingLifeMs: Math.max(400, opts.lifeMs ?? ctx.durationMs),
    remainingPierce: opts.pierce ?? 1,
    explosionRadius: opts.explosionRadius ?? 0,
    splashRatio: opts.splashRatio ?? 0,
    homingTurnRate: opts.homingTurnRate ?? 0,
    remainingBounces: opts.remainingBounces ?? 0,
    splitCount: opts.splitCount ?? 0,
    splitPierceBonus: opts.splitPierceBonus ?? 0,
    splitBounceBonus: opts.splitBounceBonus ?? 0,
    hitEnemyIds: new Set<number>(),
  };
};

/** 複数発を扇状に発射する共通ヘルパー */
export const fireFanProjectiles = (
  ctx: WeaponFireContext,
  baseAngle: number,
  count: number,
  spreadDeg: number,
  opts: ProjectileOptions,
): void => {
  const safeCount = Math.max(1, count);
  const spreadRad = (spreadDeg * Math.PI) / 180;
  const start = baseAngle - (spreadRad * (safeCount - 1)) / 2;
  for (let i = 0; i < safeCount; i += 1) {
    ctx.projectiles.push(createProjectile(ctx, start + spreadRad * i, opts));
  }
};

/** 刀剣・扇系の扇状斬撃／突風および刀剣斬撃波を発動する */
export const fireArcSlash = (
  ctx: WeaponFireContext,
  genre: "sword" | "fan",
  targetAngle: number,
  knockbackPx: number,
): void => {
  const rangeMult = Math.max(0.5, ctx.rangeMultiplier ?? 1);
  const range =
    readGenreParam(ctx.weapon.genreParams, "range", 160) * rangeMult;
  const arcRad =
    (readGenreParam(ctx.weapon.genreParams, "arcDeg", 100) * Math.PI) / 180;
  const lifeMs = Math.max(180, ctx.durationMs);
  ctx.slashArcs.push({
    id: ctx.nextEntityId(),
    genre,
    colorToken: ctx.weapon.colorToken,
    x: BARRIER_CENTER_X,
    y: BARRIER_CENTER_Y,
    angleRad: targetAngle,
    arcRad,
    range,
    remainingLifeMs: lifeMs,
    maxLifeMs: lifeMs,
  });

  if (genre === "sword" && ctx.slashWave?.enabled) {
    ctx.projectiles.push(
      createProjectile(ctx, targetAngle, {
        speed: 440,
        lifeMs: 1100,
        radius: 14 * ctx.slashWave.sizeMultiplier * rangeMult,
        pierce: 1 + ctx.slashWave.pierceBonus,
      }),
    );
  }

  const mod = ctx.modifier;
  const effectiveKnockback = knockbackPx * (mod?.knockbackMultiplier ?? 1);
  const debuffLv = mod?.debuffLevel ?? 0;
  const swordExpRadius =
    genre === "sword" && mod?.explosionEnabled
      ? 48 * mod.explosionRadiusMultiplier
      : 0;

  for (const enemy of ctx.enemies) {
    if (enemy.hp <= 0) continue;
    const dx = enemy.x - BARRIER_CENTER_X;
    const dy = enemy.y - BARRIER_CENTER_Y;
    const dist = Math.hypot(dx, dy);
    if (dist > range + enemy.radius) continue;
    if (
      Math.abs(normalizeAngleRad(Math.atan2(dy, dx) - targetAngle)) <=
      arcRad / 2
    ) {
      if (debuffLv > 0) applyEnemyDebuff(enemy, debuffLv);
      ctx.onDamageEnemy(enemy, ctx.damage, ctx.isCrit);
      if (swordExpRadius > 0) {
        applyExplosion(
          enemy.x,
          enemy.y,
          swordExpRadius,
          ctx.damage * 0.6,
          ctx.isCrit,
          enemy.id,
          ctx.enemies,
          ctx.onDamageEnemy,
          ctx.explosions,
          ctx.nextEntityId,
        );
      }
      if (effectiveKnockback > 0 && dist > 0) {
        enemy.x += (dx / dist) * effectiveKnockback;
        enemy.y += (dy / dist) * effectiveKnockback;
      }
    }
  }
};
