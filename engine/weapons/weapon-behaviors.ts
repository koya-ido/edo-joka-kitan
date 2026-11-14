import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  readGenreParam,
  type BeamEntity,
  type BellWaveEntity,
  type EnemyEntity,
  type ProjectileEntity,
  type SlashArcEntity,
} from "@/engine/types";
import type { WeaponMaster } from "@/types";

export interface WeaponFireContext {
  readonly weapon: WeaponMaster;
  readonly damage: number;
  readonly isCrit: boolean;
  readonly durationMs: number;
  readonly enemies: readonly EnemyEntity[];
  readonly projectiles: ProjectileEntity[];
  readonly slashArcs: SlashArcEntity[];
  readonly beams: BeamEntity[];
  readonly bellWaves: BellWaveEntity[];
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

interface ProjectileOptions {
  readonly radius?: number;
  readonly pierce?: number;
  readonly explosionRadius?: number;
  readonly splashRatio?: number;
  readonly homingTurnRate?: number;
}

const createProjectile = (
  ctx: WeaponFireContext,
  angleRad: number,
  opts: ProjectileOptions = {},
): ProjectileEntity => {
  const speed = Math.max(120, ctx.weapon.projectileSpeed);
  return {
    id: ctx.nextEntityId(),
    genre: ctx.weapon.genre,
    x: BARRIER_CENTER_X,
    y: BARRIER_CENTER_Y,
    vx: Math.cos(angleRad) * speed,
    vy: Math.sin(angleRad) * speed,
    speed,
    damage: ctx.damage,
    isCrit: ctx.isCrit,
    radius: opts.radius ?? 6,
    remainingLifeMs: Math.max(400, ctx.durationMs),
    remainingPierce: opts.pierce ?? 1,
    explosionRadius: opts.explosionRadius ?? 0,
    splashRatio: opts.splashRatio ?? 0,
    homingTurnRate: opts.homingTurnRate ?? 0,
    hitEnemyIds: new Set<number>(),
  };
};

const fireArcSlash = (
  ctx: WeaponFireContext,
  genre: "sword" | "fan",
  targetAngle: number,
  knockbackPx: number,
): void => {
  const range = readGenreParam(ctx.weapon.genreParams, "range", 160);
  const arcRad =
    (readGenreParam(ctx.weapon.genreParams, "arcDeg", 100) * Math.PI) / 180;
  const lifeMs = Math.max(180, ctx.durationMs);
  ctx.slashArcs.push({
    id: ctx.nextEntityId(),
    genre,
    x: BARRIER_CENTER_X,
    y: BARRIER_CENTER_Y,
    angleRad: targetAngle,
    arcRad,
    range,
    remainingLifeMs: lifeMs,
    maxLifeMs: lifeMs,
  });

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
      ctx.onDamageEnemy(enemy, ctx.damage, ctx.isCrit);
      if (knockbackPx > 0 && dist > 0) {
        enemy.x += (dx / dist) * knockbackPx;
        enemy.y += (dy / dist) * knockbackPx;
      }
    }
  }
};

/** 9系統の武器ジャンルに応じて攻撃を生成・発動する */
export const fireWeaponByGenre = (ctx: WeaponFireContext): boolean => {
  const target = findNearestEnemy(ctx.enemies);
  if (!target) return false;

  const baseAngle = Math.atan2(
    target.y - BARRIER_CENTER_Y,
    target.x - BARRIER_CENTER_X,
  );
  const { genre, genreParams } = ctx.weapon;

  switch (genre) {
    case "bow":
      ctx.projectiles.push(
        createProjectile(ctx, baseAngle, {
          pierce: Math.max(1, readGenreParam(genreParams, "pierceCount", 3)),
        }),
      );
      return true;
    case "sword":
      fireArcSlash(ctx, "sword", baseAngle, 0);
      return true;
    case "fan":
      fireArcSlash(
        ctx,
        "fan",
        baseAngle,
        readGenreParam(genreParams, "knockbackPx", 68),
      );
      return true;
    case "shuriken": {
      const count = Math.max(
        1,
        readGenreParam(genreParams, "projectileCount", 3),
      );
      const spreadRad =
        (readGenreParam(genreParams, "spreadDeg", 28) * Math.PI) / 180;
      const start = baseAngle - (spreadRad * (count - 1)) / 2;
      for (let i = 0; i < count; i += 1) {
        ctx.projectiles.push(
          createProjectile(ctx, start + spreadRad * i, { radius: 5 }),
        );
      }
      return true;
    }
    case "mirror":
      ctx.beams.push({
        id: ctx.nextEntityId(),
        targetEnemyId: target.id,
        damagePerTick: ctx.damage,
        isCrit: ctx.isCrit,
        range: readGenreParam(genreParams, "range", 240),
        tickIntervalMs: Math.max(
          80,
          readGenreParam(genreParams, "tickIntervalMs", 180),
        ),
        tickTimerMs: 0,
        remainingLifeMs: Math.max(300, ctx.durationMs),
        endX: target.x,
        endY: target.y,
      });
      return true;
    case "talisman":
      ctx.projectiles.push(
        createProjectile(ctx, baseAngle, {
          radius: 7,
          explosionRadius: readGenreParam(genreParams, "explosionRadius", 56),
          splashRatio: 1,
          homingTurnRate: readGenreParam(genreParams, "homingTurnRate", 4.5),
        }),
      );
      return true;
    case "matchlock":
      ctx.projectiles.push(
        createProjectile(ctx, baseAngle, {
          radius: 7,
          explosionRadius: readGenreParam(genreParams, "explosionRadius", 72),
          splashRatio: readGenreParam(genreParams, "splashRatio", 0.75),
        }),
      );
      return true;
    case "bell": {
      const lifeMs = Math.max(250, ctx.durationMs);
      ctx.bellWaves.push({
        id: ctx.nextEntityId(),
        x: BARRIER_CENTER_X,
        y: BARRIER_CENTER_Y,
        currentRadius: 16,
        maxRadius: readGenreParam(genreParams, "maxRadius", 175),
        damage: ctx.damage,
        isCrit: ctx.isCrit,
        remainingLifeMs: lifeMs,
        maxLifeMs: lifeMs,
        hitEnemyIds: new Set<number>(),
      });
      return true;
    }
    case "orb":
      return false;
  }
};
