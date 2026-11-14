import type { BattlePalette } from "@/engine/palette";
import { drawBackground, drawBarrierAndHero } from "@/engine/renderer-backdrop";
import { drawWeaponEffects } from "@/engine/renderer-effects";
import { drawEnemyUnits } from "@/engine/renderer-enemies";
import type {
  BeamEntity,
  EnemyEntity,
  ExplosionEntity,
  FloatingTextEntity,
  ParticleEntity,
  ProjectileEntity,
  SlashArcEntity,
  TalismanStrikeEntity,
} from "@/engine/types";
import type { WeaponMaster } from "@/types";

export interface BattleRenderState {
  readonly palette: BattlePalette;
  readonly barrierHp: number;
  readonly barrierMaxHp: number;
  readonly barrierHitPulseMs?: number;
  readonly elapsedMs?: number;
  readonly shakeX?: number;
  readonly shakeY?: number;
  readonly enemies: readonly EnemyEntity[];
  readonly projectiles: readonly ProjectileEntity[];
  readonly slashArcs: readonly SlashArcEntity[];
  readonly beams: readonly BeamEntity[];
  readonly talismanStrikes?: readonly TalismanStrikeEntity[];
  readonly explosions?: readonly ExplosionEntity[];
  readonly particles?: readonly ParticleEntity[];
  readonly floatingTexts: readonly FloatingTextEntity[];
  readonly orbitalWeapons: readonly {
    readonly weapon: WeaponMaster;
    readonly angleRad: number;
    readonly extraOrbs?: number;
    readonly rangeMultiplier?: number;
  }[];
}

const drawEnemiesAndTexts = (
  ctx: CanvasRenderingContext2D,
  state: BattleRenderState,
): void => {
  const { palette } = state;
  drawEnemyUnits(ctx, state.enemies, palette, state.elapsedMs ?? 0);

  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  for (const ft of state.floatingTexts) {
    const lifeRatio = Math.max(0, ft.remainingLifeMs / ft.maxLifeMs);
    const progress = 1 - lifeRatio;
    const popScale =
      progress < 0.2
        ? 0.9 + (progress / 0.2) * 0.4
        : 1.3 - ((progress - 0.2) / 0.8) * 0.3;

    ctx.save();
    ctx.translate(ft.x, ft.y);
    ctx.scale(popScale, popScale);
    ctx.globalAlpha = Math.min(1, lifeRatio * 1.4);
    ctx.font = ft.isCrit ? "bold 15px sans-serif" : "bold 12px sans-serif";
    ctx.strokeStyle = palette.surfaceDeep;
    ctx.lineWidth = ft.isCrit ? 3.5 : 2.5;
    ctx.strokeText(ft.text, 0, 0);
    ctx.fillStyle = ft.isHeal
      ? palette.hisui
      : ft.isCrit
        ? palette.accent
        : palette.foreground;
    ctx.fillText(ft.text, 0, 0);
    ctx.restore();
  }
};

/** 1フレーム分の Canvas 2D プロシージャル描画を実行する */
export const renderBattleFrame = (
  ctx: CanvasRenderingContext2D,
  state: BattleRenderState,
): void => {
  const sx = state.shakeX ?? 0;
  const sy = state.shakeY ?? 0;
  const elapsedMs = state.elapsedMs ?? 0;
  ctx.save();
  if (sx !== 0 || sy !== 0) {
    ctx.translate(sx, sy);
  }
  drawBackground(ctx, state.palette, elapsedMs);
  drawBarrierAndHero(
    ctx,
    state.palette,
    state.barrierHp,
    state.barrierMaxHp,
    elapsedMs,
    state.barrierHitPulseMs ?? 0,
  );
  drawEnemiesAndTexts(ctx, state);
  drawWeaponEffects(ctx, state);
  ctx.restore();
};
