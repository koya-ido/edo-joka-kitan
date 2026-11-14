import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  readGenreParam,
  type EnemyEntity,
} from "@/engine/types";
import {
  computeFanAngles,
  computeWallBounceSegments,
} from "@/engine/weapons/beam-geometry";
import { applyEnemyDebuff } from "@/engine/weapons/debuff";
import type { WeaponFireContext } from "@/engine/weapons/weapon-fire-helpers";

const MIRROR_BEAM_SPREAD_DEG = 12;

const sortEnemiesByBarrierDist = (enemies: readonly EnemyEntity[]) =>
  enemies
    .filter((e) => e.hp > 0)
    .sort(
      (a, b) =>
        Math.hypot(a.x - BARRIER_CENTER_X, a.y - BARRIER_CENTER_Y) -
        Math.hypot(b.x - BARRIER_CENTER_X, b.y - BARRIER_CENTER_Y),
    );

/** 鏡系：最寄り敵をロックオンし壁面まで貫通・壁反射するレーザー群を生成する */
export const fireMirrorBeams = (
  ctx: WeaponFireContext,
  rangeMult: number,
  extraCount: number,
  bounceBonus: number,
  explosionRadius: number,
): boolean => {
  const targets = sortEnemiesByBarrierDist(ctx.enemies);
  if (targets.length === 0) return false;
  const nearest = targets[0];

  const { genreParams } = ctx.weapon;
  const mirrorRange = readGenreParam(genreParams, "range", 240) * rangeMult;
  const baseAngle = Math.atan2(
    nearest.y - BARRIER_CENTER_Y,
    nearest.x - BARRIER_CENTER_X,
  );
  const angles = computeFanAngles(
    baseAngle,
    1 + extraCount,
    MIRROR_BEAM_SPREAD_DEG,
  );
  const tickIntervalMs = Math.max(
    80,
    readGenreParam(genreParams, "tickIntervalMs", 180),
  );
  const remainingLifeMs = Math.max(300, ctx.durationMs);

  for (const angle of angles) {
    const segments = computeWallBounceSegments(
      BARRIER_CENTER_X,
      BARRIER_CENTER_Y,
      angle,
      bounceBonus,
    );
    const lastSeg = segments[segments.length - 1];
    ctx.beams.push({
      id: ctx.nextEntityId(),
      colorToken: ctx.weapon.colorToken,
      targetEnemyId: nearest.id,
      damagePerTick: ctx.damage,
      isCrit: ctx.isCrit,
      range: mirrorRange,
      tickIntervalMs,
      tickTimerMs: 0,
      remainingLifeMs,
      endX: lastSeg.x2,
      endY: lastSeg.y2,
      bounceRemaining: bounceBonus,
      explosionRadius,
      widthMultiplier: rangeMult,
      angleOffsetRad: angle - baseAngle,
      segments,
    });
  }
  return true;
};

/** 呪符系：敵位置への直接召喚＋連鎖＋デバフ攻撃を発動する */
export const fireTalismanStrikes = (
  ctx: WeaponFireContext,
  rangeMult: number,
  extraCount: number,
): boolean => {
  const { genreParams } = ctx.weapon;
  const range = readGenreParam(genreParams, "range", 260) * rangeMult;
  const chainCount =
    readGenreParam(genreParams, "chainCount", 1) +
    (ctx.modifier?.chainBonus ?? 0);
  const chainRadius =
    readGenreParam(genreParams, "chainRadius", 85) * rangeMult;
  const debuffLv = ctx.modifier?.debuffLevel ?? 0;
  const primaries = sortEnemiesByBarrierDist(ctx.enemies)
    .filter(
      (e) =>
        Math.hypot(e.x - BARRIER_CENTER_X, e.y - BARRIER_CENTER_Y) <=
        range + e.radius,
    )
    .slice(0, 1 + extraCount);
  if (primaries.length === 0) return false;

  for (const primary of primaries) {
    applyEnemyDebuff(primary, debuffLv);
    ctx.onDamageEnemy(primary, ctx.damage, ctx.isCrit);
    const chainTargets = ctx.enemies
      .filter(
        (e) =>
          e.hp > 0 &&
          e.id !== primary.id &&
          Math.hypot(e.x - primary.x, e.y - primary.y) <=
            chainRadius + e.radius,
      )
      .slice(0, chainCount);
    const chainDmg = Math.max(1, Math.round(ctx.damage * 0.75));
    const chainLines = chainTargets.map((ct) => {
      applyEnemyDebuff(ct, debuffLv);
      ctx.onDamageEnemy(ct, chainDmg, ctx.isCrit);
      return { fromX: primary.x, fromY: primary.y, toX: ct.x, toY: ct.y };
    });
    ctx.talismanStrikes?.push({
      id: ctx.nextEntityId(),
      colorToken: ctx.weapon.colorToken,
      x: primary.x,
      y: primary.y,
      chainLines,
      remainingLifeMs: 320,
      maxLifeMs: 320,
    });
  }
  return true;
};
