import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  readGenreParam,
} from "@/engine/types";
import {
  fireMirrorBeams,
  fireTalismanStrikes,
} from "@/engine/weapons/talisman-mirror-fire";
import {
  findNearestEnemy,
  fireArcSlash,
  fireFanProjectiles,
  normalizeAngleRad,
  type SwordSlashWaveConfig,
  type WeaponFireContext,
} from "@/engine/weapons/weapon-fire-helpers";

export {
  findNearestEnemy,
  normalizeAngleRad,
  type SwordSlashWaveConfig,
  type WeaponFireContext,
};

const resolveCommonProjectileMod = (ctx: WeaponFireContext) => {
  const mod = ctx.modifier;
  return {
    extraCount: mod?.extraProjectiles ?? 0,
    pierceBonus: mod?.pierceBonus ?? 0,
    remainingBounces: mod?.bounceBonus ?? 0,
    splitCount: mod?.splitEnabled ? 2 : 0,
    splitPierceBonus: mod?.splitPierceBonus ?? 0,
    splitBounceBonus: mod?.splitBounceBonus ?? 0,
    explosionRadiusMult: mod?.explosionRadiusMultiplier ?? 1,
    unlockedExplosionRadius: mod?.explosionEnabled ? 48 : 0,
    unlockedSplashRatio: mod?.explosionEnabled ? 0.6 : 0,
  };
};

/** 8系統の武器ジャンルに応じて攻撃を生成・発動する */
export const fireWeaponByGenre = (ctx: WeaponFireContext): boolean => {
  const target = findNearestEnemy(ctx.enemies);
  if (!target) return false;

  const baseAngle = Math.atan2(
    target.y - BARRIER_CENTER_Y,
    target.x - BARRIER_CENTER_X,
  );
  const { genre, genreParams } = ctx.weapon;
  const rangeMult = Math.max(
    0.5,
    ctx.rangeMultiplier ?? ctx.modifier?.rangeMultiplier ?? 1,
  );
  const pMod = resolveCommonProjectileMod(ctx);

  switch (genre) {
    case "bow":
      fireFanProjectiles(ctx, baseAngle, 1, 12, {
        radius: 6 * rangeMult,
        pierce:
          Math.max(1, readGenreParam(genreParams, "pierceCount", 3)) +
          pMod.pierceBonus,
        remainingBounces: pMod.remainingBounces,
        splitCount: pMod.splitCount,
        splitPierceBonus: pMod.splitPierceBonus,
        splitBounceBonus: pMod.splitBounceBonus,
        explosionRadius:
          pMod.unlockedExplosionRadius * pMod.explosionRadiusMult,
        splashRatio: pMod.unlockedSplashRatio,
      });
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
      const baseCount = Math.max(
        1,
        readGenreParam(genreParams, "projectileCount", 3),
      );
      const count = Math.min(10, baseCount + pMod.extraCount);
      fireFanProjectiles(
        ctx,
        baseAngle,
        count,
        readGenreParam(genreParams, "spreadDeg", 28),
        {
          radius: 5 * rangeMult,
          pierce: 1 + pMod.pierceBonus,
          remainingBounces: pMod.remainingBounces,
          splitCount: pMod.splitCount,
          splitPierceBonus: pMod.splitPierceBonus,
          splitBounceBonus: pMod.splitBounceBonus,
          explosionRadius:
            pMod.unlockedExplosionRadius * pMod.explosionRadiusMult,
          splashRatio: pMod.unlockedSplashRatio,
        },
      );
      return true;
    }
    case "mirror":
      return fireMirrorBeams(
        ctx,
        rangeMult,
        pMod.extraCount,
        pMod.remainingBounces,
        pMod.unlockedExplosionRadius * pMod.explosionRadiusMult,
      );
    case "talisman":
      return fireTalismanStrikes(ctx, rangeMult, pMod.extraCount);
    case "matchlock":
      fireFanProjectiles(ctx, baseAngle, 1, 10, {
        radius: 7,
        pierce: 1 + pMod.pierceBonus,
        remainingBounces: pMod.remainingBounces,
        explosionRadius:
          readGenreParam(genreParams, "explosionRadius", 72) *
          rangeMult *
          pMod.explosionRadiusMult,
        splashRatio: readGenreParam(genreParams, "splashRatio", 0.75),
        splitCount: pMod.splitCount,
        splitPierceBonus: pMod.splitPierceBonus,
        splitBounceBonus: pMod.splitBounceBonus,
      });
      return true;
    case "orb":
      return false;
  }
};
