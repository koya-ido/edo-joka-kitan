import type { BattlePalette } from "@/engine/palette";
import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  type BeamEntity,
  type SlashArcEntity,
} from "@/engine/types";

const drawStarFlare = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  coreColor: string,
): void => {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-radius, 0);
  ctx.lineTo(radius, 0);
  ctx.moveTo(0, -radius);
  ctx.lineTo(0, radius);
  ctx.stroke();

  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

/** 刀剣系：加算合成＋放射グラデーションの斬撃弧＋白刃エッジを描画する */
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
  grad.addColorStop(0.55, `color-mix(in srgb, ${color} 38%, transparent)`);
  grad.addColorStop(0.88, `color-mix(in srgb, ${color} 90%, transparent)`);
  grad.addColorStop(1, color);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(arc.x, arc.y, outerRadius, startAngle, endAngle);
  ctx.arc(arc.x, arc.y, innerRadius, endAngle, startAngle, true);
  ctx.closePath();
  ctx.fill();

  ctx.lineCap = "round";
  ctx.globalAlpha = alpha * 0.95;
  ctx.strokeStyle = palette.foreground;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(arc.x, arc.y, outerRadius - 1, startAngle + 0.05, endAngle - 0.05);
  ctx.stroke();

  // 内側の追従残像エッジ
  ctx.globalAlpha = alpha * 0.45;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(arc.x, arc.y, outerRadius * 0.78, startAngle + 0.12, endAngle - 0.12);
  ctx.stroke();
  ctx.restore();
};

/** 扇・軍配系：加算合成の三重風圧ウェーブ弧を描画する */
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
    { scale: 0.94, width: 7, opacity: 0.95 },
  ];

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
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

/** 鏡系：加算合成の3層照射ビーム＋着弾十字フレアを描画する */
export const drawMirrorBeam = (
  ctx: CanvasRenderingContext2D,
  beam: BeamEntity,
  color: string,
  palette: BattlePalette,
): void => {
  const pulse = 1 + Math.sin(beam.remainingLifeMs * 0.04) * 0.18;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = color;
  ctx.lineWidth = 12 * pulse;
  ctx.beginPath();
  ctx.moveTo(BARRIER_CENTER_X, BARRIER_CENTER_Y);
  ctx.lineTo(beam.endX, beam.endY);
  ctx.stroke();

  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4 * pulse;
  ctx.beginPath();
  ctx.moveTo(BARRIER_CENTER_X, BARRIER_CENTER_Y);
  ctx.lineTo(beam.endX, beam.endY);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.strokeStyle = palette.foreground;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(BARRIER_CENTER_X, BARRIER_CENTER_Y);
  ctx.lineTo(beam.endX, beam.endY);
  ctx.stroke();

  drawStarFlare(
    ctx,
    beam.endX,
    beam.endY,
    12 * pulse,
    color,
    palette.foreground,
  );

  for (const cp of beam.chainPoints ?? []) {
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(beam.endX, beam.endY);
    ctx.lineTo(cp.x, cp.y);
    ctx.stroke();

    ctx.strokeStyle = palette.foreground;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    drawStarFlare(ctx, cp.x, cp.y, 7.5, color, palette.foreground);
  }

  ctx.restore();
};

/** 霊珠・勾玉系：加算合成オーラを纏う旋回霊珠を描画する */
export const drawOrbNode = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  palette: BattlePalette,
): void => {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = palette.foreground;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(x, y, 10.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.foreground;
  ctx.beginPath();
  ctx.arc(x - 2, y - 2, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};
