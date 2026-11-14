import type { BattlePalette } from "@/engine/palette";
import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  BARRIER_RADIUS,
  BATTLE_FIELD_HEIGHT,
  BATTLE_FIELD_WIDTH,
} from "@/engine/types";

const MIST_ORBS = [
  { baseX: 70, baseY: 90, radius: 110, speedY: 0.014, phase: 0.2 },
  { baseX: 330, baseY: 230, radius: 125, speedY: 0.011, phase: 1.7 },
  { baseX: 160, baseY: 390, radius: 130, speedY: 0.016, phase: 3.1 },
  { baseX: 310, baseY: 540, radius: 95, speedY: 0.012, phase: 4.5 },
] as const;

const drawPolygon = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotationRad: number,
): void => {
  ctx.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const angle = rotationRad + (Math.PI * 2 * i) / sides;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
};

/** 夜陰の参道・石畳・妖霧・霊気を描画する */
export const drawBackground = (
  ctx: CanvasRenderingContext2D,
  palette: BattlePalette,
  elapsedMs: number,
): void => {
  const bgGrad = ctx.createLinearGradient(0, 0, 0, BATTLE_FIELD_HEIGHT);
  bgGrad.addColorStop(0, palette.surfaceDeep);
  bgGrad.addColorStop(0.7, palette.surface);
  bgGrad.addColorStop(1, palette.surfaceDeep);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, BATTLE_FIELD_WIDTH, BATTLE_FIELD_HEIGHT);

  // 参道・石畳風の控えめな縦導線と横目地
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = palette.surfaceDeep;
  ctx.lineWidth = 1;
  for (let x = 42; x < BATTLE_FIELD_WIDTH; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, BATTLE_FIELD_HEIGHT);
    ctx.stroke();
  }
  for (let y = 42; y < BATTLE_FIELD_HEIGHT; y += 56) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(BATTLE_FIELD_WIDTH, y);
    ctx.stroke();
  }

  // 参道中央の淡い道筋
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = palette.magatama;
  ctx.fillRect(BARRIER_CENTER_X - 48, 0, 96, BATTLE_FIELD_HEIGHT);
  ctx.restore();

  // ゆっくり流れる妖霧
  for (const orb of MIST_ORBS) {
    const span = BATTLE_FIELD_HEIGHT + orb.radius * 2;
    const y = ((orb.baseY + elapsedMs * orb.speedY) % span) - orb.radius;
    const x = orb.baseX + Math.sin(elapsedMs * 0.0006 + orb.phase) * 22;
    const grad = ctx.createRadialGradient(x, y, 4, x, y, orb.radius);
    grad.addColorStop(0, palette.magatama);
    grad.addColorStop(1, "transparent");
    ctx.save();
    ctx.globalAlpha = 0.075;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, orb.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 結界周囲に漂う微細な霊気粒子
  ctx.save();
  ctx.fillStyle = palette.hisui;
  for (let i = 0; i < 10; i += 1) {
    const a = elapsedMs * 0.00045 + i * 0.628;
    const dist = BARRIER_RADIUS + 24 + (i % 3) * 18;
    const px = BARRIER_CENTER_X + Math.cos(a) * dist;
    const py = BARRIER_CENTER_Y + Math.sin(a * 1.1) * (dist * 0.72);
    ctx.globalAlpha = 0.2 + 0.18 * Math.sin(elapsedMs * 0.003 + i);
    ctx.beginPath();
    ctx.arc(px, py, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

/** 回転する和風結界紋様・被弾波紋・主人公シンボルを描画する */
export const drawBarrierAndHero = (
  ctx: CanvasRenderingContext2D,
  palette: BattlePalette,
  barrierHp: number,
  barrierMaxHp: number,
  elapsedMs: number,
  barrierHitPulseMs: number,
): void => {
  const hpRatio = barrierMaxHp > 0 ? Math.max(0, barrierHp / barrierMaxHp) : 0;
  const isLowHp = hpRatio <= 0.3;
  const ringColor =
    barrierHitPulseMs > 0 || isLowHp ? palette.destructive : palette.barrier;

  ctx.save();
  ctx.globalAlpha = 0.14 + hpRatio * 0.18;
  ctx.fillStyle = ringColor;
  ctx.beginPath();
  ctx.arc(BARRIER_CENTER_X, BARRIER_CENTER_Y, BARRIER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // 内側の逆回転・八角形結界陣
  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 1.5;
  drawPolygon(
    ctx,
    BARRIER_CENTER_X,
    BARRIER_CENTER_Y,
    BARRIER_RADIUS * 0.78,
    8,
    -elapsedMs * 0.0005,
  );
  ctx.stroke();

  // 外周の回転破線リング
  ctx.globalAlpha = 0.75;
  ctx.save();
  ctx.translate(BARRIER_CENTER_X, BARRIER_CENTER_Y);
  ctx.rotate(elapsedMs * 0.0004);
  ctx.setLineDash([10, 6]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, BARRIER_RADIUS - 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 結界の外枠実線
  ctx.globalAlpha = 0.88;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(BARRIER_CENTER_X, BARRIER_CENTER_Y, BARRIER_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // 被弾時の衝撃波紋
  if (barrierHitPulseMs > 0) {
    const pulseProgress = 1 - barrierHitPulseMs / 280;
    ctx.globalAlpha = Math.max(0, (1 - pulseProgress) * 0.75);
    ctx.strokeStyle = palette.destructive;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      BARRIER_CENTER_X,
      BARRIER_CENTER_Y,
      BARRIER_RADIUS + pulseProgress * 28,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  ctx.restore();

  // 主人公シンボル（霊力オーラ＋和装シルエット）
  const auraRadius = 19 + Math.sin(elapsedMs * 0.004) * 2;
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = palette.hisui;
  ctx.beginPath();
  ctx.arc(BARRIER_CENTER_X, BARRIER_CENTER_Y, auraRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = palette.primary;
  ctx.beginPath();
  ctx.arc(BARRIER_CENTER_X, BARRIER_CENTER_Y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = palette.foreground;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(BARRIER_CENTER_X, BARRIER_CENTER_Y, 5, 0, Math.PI * 2);
  ctx.fill();
};
