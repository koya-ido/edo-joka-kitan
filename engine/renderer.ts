import type { BattlePalette } from "@/engine/palette";
import { drawWeaponEffects } from "@/engine/renderer-effects";
import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  BARRIER_RADIUS,
  BATTLE_FIELD_HEIGHT,
  BATTLE_FIELD_WIDTH,
  type BeamEntity,
  type BellWaveEntity,
  type EnemyEntity,
  type FloatingTextEntity,
  type ProjectileEntity,
  type SlashArcEntity,
} from "@/engine/types";
import type { WeaponMaster } from "@/types";

export interface BattleRenderState {
  readonly palette: BattlePalette;
  readonly barrierHp: number;
  readonly barrierMaxHp: number;
  readonly enemies: readonly EnemyEntity[];
  readonly projectiles: readonly ProjectileEntity[];
  readonly slashArcs: readonly SlashArcEntity[];
  readonly beams: readonly BeamEntity[];
  readonly bellWaves: readonly BellWaveEntity[];
  readonly floatingTexts: readonly FloatingTextEntity[];
  readonly orbitalWeapons: readonly {
    readonly weapon: WeaponMaster;
    readonly angleRad: number;
  }[];
}

const drawBackground = (
  ctx: CanvasRenderingContext2D,
  palette: BattlePalette,
): void => {
  ctx.fillStyle = palette.surfaceDeep;
  ctx.fillRect(0, 0, BATTLE_FIELD_WIDTH, BATTLE_FIELD_HEIGHT);

  ctx.strokeStyle = palette.surface;
  ctx.lineWidth = 1;
  for (let x = 0; x <= BATTLE_FIELD_WIDTH; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, BATTLE_FIELD_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= BATTLE_FIELD_HEIGHT; y += 42) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(BATTLE_FIELD_WIDTH, y);
    ctx.stroke();
  }
};

const drawBarrierAndHero = (
  ctx: CanvasRenderingContext2D,
  state: BattleRenderState,
): void => {
  const { palette, barrierHp, barrierMaxHp } = state;
  const hpRatio = barrierMaxHp > 0 ? Math.max(0, barrierHp / barrierMaxHp) : 0;

  ctx.save();
  ctx.globalAlpha = 0.16 + hpRatio * 0.22;
  ctx.fillStyle = palette.barrier;
  ctx.beginPath();
  ctx.arc(BARRIER_CENTER_X, BARRIER_CENTER_Y, BARRIER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = hpRatio > 0.3 ? palette.barrier : palette.destructive;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(BARRIER_CENTER_X, BARRIER_CENTER_Y, BARRIER_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = palette.primary;
  ctx.beginPath();
  ctx.arc(BARRIER_CENTER_X, BARRIER_CENTER_Y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = palette.foreground;
  ctx.lineWidth = 2;
  ctx.stroke();
};

const drawEnemiesAndTexts = (
  ctx: CanvasRenderingContext2D,
  state: BattleRenderState,
): void => {
  const { palette } = state;

  for (const enemy of state.enemies) {
    ctx.fillStyle =
      enemy.hitFlashMs > 0
        ? palette.foreground
        : enemy.isBoss
          ? palette.primary
          : palette.destructive;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    const barWidth = enemy.radius * 2;
    const barX = enemy.x - enemy.radius;
    const barY = enemy.y - enemy.radius - 8;
    ctx.fillStyle = palette.surface;
    ctx.fillRect(barX, barY, barWidth, 4);
    ctx.fillStyle = enemy.isBoss ? palette.accent : palette.barrier;
    ctx.fillRect(barX, barY, barWidth * Math.max(0, enemy.hp / enemy.maxHp), 4);
  }

  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  for (const ft of state.floatingTexts) {
    ctx.save();
    ctx.globalAlpha = Math.max(0.2, ft.remainingLifeMs / ft.maxLifeMs);
    ctx.fillStyle = ft.isHeal
      ? palette.hisui
      : ft.isCrit
        ? palette.accent
        : palette.foreground;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
};

/** 1フレーム分の Canvas 2D プロシージャル描画を実行する */
export const renderBattleFrame = (
  ctx: CanvasRenderingContext2D,
  state: BattleRenderState,
): void => {
  drawBackground(ctx, state.palette);
  drawBarrierAndHero(ctx, state);
  drawWeaponEffects(ctx, state);
  drawEnemiesAndTexts(ctx, state);
};
