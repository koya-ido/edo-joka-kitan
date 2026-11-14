import type { BattlePalette } from "@/engine/palette";
import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  type BeamEntity,
  type SlashArcEntity,
  type TalismanStrikeEntity,
} from "@/engine/types";

/** 刀剣系：外側が濃く内側が薄い放射グラデーションの斬撃弧＋白刃エッジを描画する */
export const drawSwordSlash = (
  ctx: CanvasRenderingContext2D,
  arc: SlashArcEntity,
  color: string,
  palette: BattlePalette,
): void => {
  const alpha = Math.max(0.15, arc.remainingLifeMs / arc.maxLifeMs);
  const outerRadius = Math.max(28, arc.range);
  const innerRadius = Math.max(8, outerRadius * 0.42);
  const startAngle = arc.angleRad - arc.arcRad / 2;
  const endAngle = arc.angleRad + arc.arcRad / 2;
  const grad = ctx.createRadialGradient(
    arc.x,
    arc.y,
    innerRadius,
    arc.x,
    arc.y,
    outerRadius,
  );
  grad.addColorStop(0, `color-mix(in srgb, ${color} 0%, transparent)`);
  grad.addColorStop(0.55, `color-mix(in srgb, ${color} 32%, transparent)`);
  grad.addColorStop(0.88, `color-mix(in srgb, ${color} 85%, transparent)`);
  grad.addColorStop(1, color);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(arc.x, arc.y, outerRadius, startAngle, endAngle);
  ctx.arc(arc.x, arc.y, innerRadius, endAngle, startAngle, true);
  ctx.closePath();
  ctx.fill();

  ctx.lineCap = "round";
  ctx.globalAlpha = alpha * 0.9;
  ctx.strokeStyle = palette.foreground;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(arc.x, arc.y, outerRadius - 1, startAngle + 0.06, endAngle - 0.06);
  ctx.stroke();
  ctx.restore();
};

/** 扇・軍配系：三重の風圧ウェーブ弧を描画する */
export const drawFanGust = (
  ctx: CanvasRenderingContext2D,
  arc: SlashArcEntity,
  color: string,
): void => {
  const alpha = Math.max(0.15, arc.remainingLifeMs / arc.maxLifeMs);
  const startAngle = arc.angleRad - arc.arcRad / 2;
  const endAngle = arc.angleRad + arc.arcRad / 2;
  const rings = [
    { scale: 0.54, width: 3, opacity: 0.45 },
    { scale: 0.74, width: 5, opacity: 0.75 },
    { scale: 0.94, width: 7, opacity: 0.9 },
  ];

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  for (const ring of rings) {
    ctx.globalAlpha = alpha * ring.opacity;
    ctx.lineWidth = ring.width;
    ctx.beginPath();
    ctx.arc(arc.x, arc.y, arc.range * ring.scale, startAngle, endAngle);
    ctx.stroke();
  }
  ctx.restore();
};

/** 鏡系：二重構造の照射ビーム＋着弾フレアを描画する */
export const drawMirrorBeam = (
  ctx: CanvasRenderingContext2D,
  beam: BeamEntity,
  color: string,
  palette: BattlePalette,
): void => {
  ctx.save();
  ctx.lineCap = "round";

  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(BARRIER_CENTER_X, BARRIER_CENTER_Y);
  ctx.lineTo(beam.endX, beam.endY);
  ctx.stroke();

  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(BARRIER_CENTER_X, BARRIER_CENTER_Y);
  ctx.lineTo(beam.endX, beam.endY);
  ctx.stroke();

  ctx.strokeStyle = palette.foreground;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(BARRIER_CENTER_X, BARRIER_CENTER_Y);
  ctx.lineTo(beam.endX, beam.endY);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(beam.endX, beam.endY, 7, 0, Math.PI * 2);
  ctx.fill();

  for (const cp of beam.chainPoints ?? []) {
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(beam.endX, beam.endY);
    ctx.lineTo(cp.x, cp.y);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};

/** 呪符系：敵頭上への召喚落雷・霊風＋連鎖アークを描画する */
export const drawTalismanStrike = (
  ctx: CanvasRenderingContext2D,
  strike: TalismanStrikeEntity,
  color: string,
  palette: BattlePalette,
): void => {
  const alpha = Math.max(0.15, strike.remainingLifeMs / strike.maxLifeMs);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(strike.x - 6, strike.y - 44);
  ctx.lineTo(strike.x + 5, strike.y - 20);
  ctx.lineTo(strike.x - 4, strike.y - 8);
  ctx.lineTo(strike.x, strike.y);
  ctx.stroke();

  ctx.strokeStyle = palette.foreground;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(strike.x, strike.y, 16 * (1.2 - alpha * 0.4), 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (const line of strike.chainLines) {
    ctx.beginPath();
    ctx.moveTo(line.fromX, line.fromY);
    ctx.lineTo(line.toX, line.toY);
    ctx.stroke();
  }
  ctx.restore();
};

/** 霊珠・勾玉系：オーラを纏う旋回霊珠を描画する */
export const drawOrbNode = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  palette: BattlePalette,
): void => {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.foreground;
  ctx.beginPath();
  ctx.arc(x - 2, y - 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};
