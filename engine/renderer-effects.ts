import type { BattlePalette } from "@/engine/palette";
import { drawProjectileByGenre } from "@/engine/renderer-projectile-shapes";
import {
  drawFanGust,
  drawMirrorBeam,
  drawOrbNode,
  drawSwordSlash,
  drawTalismanStrike,
} from "@/engine/renderer-weapon-shapes";
import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  readGenreParam,
  type BeamEntity,
  type ExplosionEntity,
  type ParticleEntity,
  type ProjectileEntity,
  type SlashArcEntity,
  type TalismanStrikeEntity,
} from "@/engine/types";
import type { WeaponMaster } from "@/types";

export interface WeaponEffectsRenderData {
  readonly palette: BattlePalette;
  readonly slashArcs: readonly SlashArcEntity[];
  readonly beams: readonly BeamEntity[];
  readonly talismanStrikes?: readonly TalismanStrikeEntity[];
  readonly explosions?: readonly ExplosionEntity[];
  readonly particles?: readonly ParticleEntity[];
  readonly projectiles: readonly ProjectileEntity[];
  readonly orbitalWeapons: readonly {
    readonly weapon: WeaponMaster;
    readonly angleRad: number;
    readonly extraOrbs?: number;
    readonly rangeMultiplier?: number;
  }[];
}

/** 9系統の武器エフェクト・弾道・波動を武器色と武器種別形状で Canvas へ描画する */
export const drawWeaponEffects = (
  ctx: CanvasRenderingContext2D,
  state: WeaponEffectsRenderData,
): void => {
  const { palette } = state;

  for (const arc of state.slashArcs) {
    const color = palette.weaponColors[arc.colorToken];
    if (arc.genre === "fan") {
      drawFanGust(ctx, arc, color);
    } else {
      drawSwordSlash(ctx, arc, color, palette);
    }
  }

  for (const beam of state.beams) {
    const color = palette.weaponColors[beam.colorToken];
    drawMirrorBeam(ctx, beam, color, palette);
  }

  for (const strike of state.talismanStrikes ?? []) {
    const color = palette.weaponColors[strike.colorToken];
    drawTalismanStrike(ctx, strike, color, palette);
  }

  for (const exp of state.explosions ?? []) {
    const progress = 1 - Math.max(0, exp.remainingLifeMs) / exp.maxLifeMs;
    const alpha = Math.max(0, 1 - progress);
    const currentRadius = Math.max(8, exp.radius * (0.35 + 0.65 * progress));
    ctx.save();
    ctx.globalAlpha = alpha * 0.35;
    ctx.fillStyle = palette.primary;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = palette.foreground;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, currentRadius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const orb of state.orbitalWeapons) {
    const color = palette.weaponColors[orb.weapon.colorToken];
    const count = Math.max(
      1,
      readGenreParam(orb.weapon.genreParams, "orbCount", 3) +
        (orb.extraOrbs ?? 0),
    );
    const radius =
      readGenreParam(orb.weapon.genreParams, "orbitRadius", 88) *
      Math.max(0.5, orb.rangeMultiplier ?? 1);
    for (let i = 0; i < count; i += 1) {
      const a = orb.angleRad + ((Math.PI * 2) / count) * i;
      drawOrbNode(
        ctx,
        BARRIER_CENTER_X + Math.cos(a) * radius,
        BARRIER_CENTER_Y + Math.sin(a) * radius,
        color,
        palette,
      );
    }
  }

  for (const p of state.projectiles) {
    const color = palette.weaponColors[p.colorToken];
    drawProjectileByGenre(ctx, p, color, palette);
  }

  for (const pt of state.particles ?? []) {
    const lifeRatio = Math.max(0, pt.remainingLifeMs / pt.maxLifeMs);
    const radius = Math.max(0.8, pt.size * (0.35 + 0.65 * lifeRatio));
    ctx.save();
    ctx.globalAlpha = Math.min(1, lifeRatio * 1.15);
    ctx.fillStyle = palette[pt.colorKey];
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};
