import type { BattlePalette } from "@/engine/palette";
import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  readGenreParam,
  type BeamEntity,
  type BellWaveEntity,
  type ProjectileEntity,
  type SlashArcEntity,
} from "@/engine/types";
import type { WeaponMaster } from "@/types";

export interface WeaponEffectsRenderData {
  readonly palette: BattlePalette;
  readonly slashArcs: readonly SlashArcEntity[];
  readonly beams: readonly BeamEntity[];
  readonly bellWaves: readonly BellWaveEntity[];
  readonly projectiles: readonly ProjectileEntity[];
  readonly orbitalWeapons: readonly {
    readonly weapon: WeaponMaster;
    readonly angleRad: number;
  }[];
}

/** 9系統の武器エフェクト・弾道・波動を Canvas へ描画する */
export const drawWeaponEffects = (
  ctx: CanvasRenderingContext2D,
  state: WeaponEffectsRenderData,
): void => {
  const { palette } = state;

  for (const arc of state.slashArcs) {
    ctx.save();
    ctx.globalAlpha = Math.max(0.15, arc.remainingLifeMs / arc.maxLifeMs);
    ctx.strokeStyle = arc.genre === "fan" ? palette.hisui : palette.accent;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(
      arc.x,
      arc.y,
      arc.range * 0.72,
      arc.angleRad - arc.arcRad / 2,
      arc.angleRad + arc.arcRad / 2,
    );
    ctx.stroke();
    ctx.restore();
  }

  for (const beam of state.beams) {
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(BARRIER_CENTER_X, BARRIER_CENTER_Y);
    ctx.lineTo(beam.endX, beam.endY);
    ctx.stroke();
    ctx.restore();
  }

  for (const wave of state.bellWaves) {
    ctx.save();
    ctx.globalAlpha = Math.max(0.1, wave.remainingLifeMs / wave.maxLifeMs);
    ctx.strokeStyle = palette.magatama;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, wave.currentRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (const orb of state.orbitalWeapons) {
    const count = Math.max(
      1,
      readGenreParam(orb.weapon.genreParams, "orbCount", 3),
    );
    const radius = readGenreParam(orb.weapon.genreParams, "orbitRadius", 88);
    for (let i = 0; i < count; i += 1) {
      const a = orb.angleRad + ((Math.PI * 2) / count) * i;
      ctx.fillStyle = palette.magatama;
      ctx.beginPath();
      ctx.arc(
        BARRIER_CENTER_X + Math.cos(a) * radius,
        BARRIER_CENTER_Y + Math.sin(a) * radius,
        8,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  for (const p of state.projectiles) {
    ctx.fillStyle =
      p.genre === "talisman"
        ? palette.magatama
        : p.genre === "matchlock"
          ? palette.primary
          : palette.accent;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
};
