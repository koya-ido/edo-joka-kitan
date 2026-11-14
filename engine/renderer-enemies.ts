import type { BattlePalette } from "@/engine/palette";
import type { EnemyEntity } from "@/engine/types";

const drawDropShadow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  palette: BattlePalette,
): void => {
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = palette.surfaceDeep;
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.88, r * 0.88, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawOniImp = (
  ctx: CanvasRenderingContext2D,
  r: number,
  bodyColor: string,
  palette: BattlePalette,
  isFlashing: boolean,
): void => {
  ctx.fillStyle = isFlashing ? palette.foreground : palette.accent;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.28, -r * 0.72);
    ctx.lineTo(side * r * 0.62, -r * 1.32);
    ctx.lineTo(side * r * 0.72, -r * 0.56);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isFlashing ? palette.foreground : palette.surfaceDeep;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (isFlashing) return;

  ctx.fillStyle = palette.accent;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.16, -r * 0.12);
    ctx.lineTo(side * r * 0.52, -r * 0.28);
    ctx.lineTo(side * r * 0.44, -r * 0.02);
    ctx.closePath();
    ctx.fill();
  }
};

const drawKappaStray = (
  ctx: CanvasRenderingContext2D,
  r: number,
  bodyColor: string,
  palette: BattlePalette,
  isFlashing: boolean,
): void => {
  ctx.fillStyle = isFlashing ? palette.foreground : palette.surface;
  ctx.beginPath();
  ctx.arc(0, r * 0.06, r * 1.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
  ctx.fill();
  if (isFlashing) return;

  ctx.fillStyle = palette.hisui;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.58, r * 0.52, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = palette.foreground;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.moveTo(-r * 0.22, r * 0.14);
  ctx.lineTo(r * 0.22, r * 0.14);
  ctx.lineTo(0, r * 0.36);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = palette.foreground;
  ctx.beginPath();
  ctx.arc(-r * 0.34, -r * 0.12, r * 0.13, 0, Math.PI * 2);
  ctx.arc(r * 0.34, -r * 0.12, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
};

const drawBossNue = (
  ctx: CanvasRenderingContext2D,
  r: number,
  bodyColor: string,
  palette: BattlePalette,
  elapsedMs: number,
  isFlashing: boolean,
): void => {
  ctx.save();
  ctx.rotate(elapsedMs * 0.0018);
  ctx.strokeStyle = isFlashing ? palette.foreground : palette.magatama;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  for (let i = 0; i < 20; i += 1) {
    const a = (Math.PI * i) / 10 + elapsedMs * 0.0006;
    const rad = i % 2 === 0 ? r * 1.08 : r * 0.88;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = isFlashing ? palette.foreground : palette.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (isFlashing) return;

  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(0, -r * 0.34, r * 0.14, 0, Math.PI * 2);
  ctx.arc(-r * 0.36, 0, r * 0.15, 0, Math.PI * 2);
  ctx.arc(r * 0.36, 0, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
};

const drawEnemyHpBar = (
  ctx: CanvasRenderingContext2D,
  enemy: EnemyEntity,
  palette: BattlePalette,
  hasSlow: boolean,
  hasVulnerable: boolean,
): void => {
  const barWidth = enemy.radius * 2;
  const barX = enemy.x - enemy.radius;
  const barY = enemy.y - enemy.radius - 10;
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
};

/** 敵ユニット（妖怪）を種別ごとのシルエット・影・歩行アニメーション付きで描画する */
export const drawEnemyUnits = (
  ctx: CanvasRenderingContext2D,
  enemies: readonly EnemyEntity[],
  palette: BattlePalette,
  elapsedMs: number,
): void => {
  for (const enemy of enemies) {
    const hasSlow = (enemy.slowRemainingMs ?? 0) > 0;
    const hasVulnerable = (enemy.vulnerableRemainingMs ?? 0) > 0;
    const hasDebuff = hasSlow || hasVulnerable;
    const isFlashing = enemy.hitFlashMs > 0;

    drawDropShadow(ctx, enemy.x, enemy.y, enemy.radius, palette);

    const phase = elapsedMs * (enemy.isBoss ? 0.005 : 0.009) + enemy.id * 1.3;
    const bobY = Math.sin(phase) * (enemy.isBoss ? 2.5 : 1.8);
    const squash = Math.sin(phase * 2) * 0.05;

    if (hasDebuff) {
      ctx.save();
      ctx.strokeStyle = hasSlow ? palette.exp : palette.magatama;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y + bobY, enemy.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const bodyColor = isFlashing
      ? palette.foreground
      : enemy.isBoss
        ? palette.primary
        : enemy.enemyId === "kappa_stray"
          ? palette.magatama
          : palette.destructive;

    ctx.save();
    ctx.translate(enemy.x, enemy.y + bobY);
    ctx.scale(1 + squash, 1 - squash);

    if (enemy.enemyId === "boss_nue" || enemy.isBoss) {
      drawBossNue(ctx, enemy.radius, bodyColor, palette, elapsedMs, isFlashing);
    } else if (enemy.enemyId === "kappa_stray") {
      drawKappaStray(ctx, enemy.radius, bodyColor, palette, isFlashing);
    } else {
      drawOniImp(ctx, enemy.radius, bodyColor, palette, isFlashing);
    }
    ctx.restore();

    drawEnemyHpBar(ctx, enemy, palette, hasSlow, hasVulnerable);
  }
};
