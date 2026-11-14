import type { BattlePalette } from "@/engine/palette";
import { drawWeaponEffects } from "@/engine/renderer-effects";
import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  BARRIER_RADIUS,
  BATTLE_FIELD_HEIGHT,
  BATTLE_FIELD_WIDTH,
  type BeamEntity,
  type EnemyEntity,
  type ExplosionEntity,
  type FloatingTextEntity,
  type ProjectileEntity,
  type SlashArcEntity,
  type TalismanStrikeEntity,
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
  readonly talismanStrikes?: readonly TalismanStrikeEntity[];
  readonly explosions?: readonly ExplosionEntity[];
  readonly floatingTexts: readonly FloatingTextEntity[];
  readonly orbitalWeapons: readonly {
    readonly weapon: WeaponMaster;
    readonly angleRad: number;
    readonly extraOrbs?: number;
    readonly rangeMultiplier?: number;
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
    const hasSlow = (enemy.slowRemainingMs ?? 0) > 0;
    const hasVulnerable = (enemy.vulnerableRemainingMs ?? 0) > 0;
    const hasDebuff = hasSlow || hasVulnerable;

    if (hasDebuff) {
      ctx.save();
      ctx.strokeStyle = palette.magatama;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle =
      enemy.hitFlashMs > 0
        ? palette.foreground
        : enemy.isBoss
          ? palette.primary
          : palette.destructive;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    if (hasDebuff && enemy.hitFlashMs <= 0) {
      ctx.save();
      ctx.strokeStyle = hasSlow ? palette.exp : palette.magatama;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    const barWidth = enemy.radius * 2;
    const barX = enemy.x - enemy.radius;
    const barY = enemy.y - enemy.radius - 8;
    ctx.fillStyle = palette.surface;
    ctx.fillRect(barX, barY, barWidth, 4);
    ctx.fillStyle = enemy.isBoss ? palette.accent : palette.barrier;
    ctx.fillRect(barX, barY, barWidth * Math.max(0, enemy.hp / enemy.maxHp), 4);

    if (hasSlow) {
      ctx.fillStyle = palette.exp;
      ctx.beginPath();
      ctx.arc(barX - 5, barY + 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (hasVulnerable) {
      ctx.fillStyle = palette.magatama;
      ctx.beginPath();
      ctx.arc(barX + barWidth + 5, barY + 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
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
