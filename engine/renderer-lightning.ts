import type { BattlePalette } from "@/engine/palette";
import type { TalismanStrikeEntity } from "@/engine/types";

interface Point2D {
  readonly x: number;
  readonly y: number;
}

/** 決定論的擬似乱数（-1.0 〜 1.0） */
const hashNoise = (seed: number): number => {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};

/** 2点間を分割し、法線方向へランダム風に変位させた稲妻点列を生成する */
export const buildJaggedPoints = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  segments: number,
  jitter: number,
  seed: number,
): readonly Point2D[] => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  const points: Point2D[] = [{ x: fromX, y: fromY }];
  for (let i = 1; i < segments; i += 1) {
    const t = i / segments;
    const envelope = Math.sin(t * Math.PI);
    const offset = hashNoise(seed + i * 17.3) * jitter * envelope;
    points.push({
      x: fromX + dx * t + nx * offset,
      y: fromY + dy * t + ny * offset,
    });
  }
  points.push({ x: toX, y: toY });
  return points;
};

const strokePointPath = (
  ctx: CanvasRenderingContext2D,
  points: readonly Point2D[],
): void => {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
};

/** 加算合成の3層グロー（外光・本体色・白熱芯）で稲妻パスを描画する */
export const drawLightningGlowPath = (
  ctx: CanvasRenderingContext2D,
  points: readonly Point2D[],
  color: string,
  coreColor: string,
  outerWidth: number,
  midWidth: number,
  coreWidth: number,
  alpha: number,
): void => {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.globalAlpha = alpha * 0.28;
  ctx.strokeStyle = color;
  ctx.lineWidth = outerWidth;
  strokePointPath(ctx, points);

  ctx.globalAlpha = alpha * 0.92;
  ctx.strokeStyle = color;
  ctx.lineWidth = midWidth;
  strokePointPath(ctx, points);

  ctx.globalAlpha = alpha;
  ctx.strokeStyle = coreColor;
  ctx.lineWidth = coreWidth;
  strokePointPath(ctx, points);
  ctx.restore();
};

/** 呪符系：多段枝分かれ落雷＋連鎖アーク＋着弾呪符陣＆スパークを描画する */
export const drawTalismanStrike = (
  ctx: CanvasRenderingContext2D,
  strike: TalismanStrikeEntity,
  color: string,
  palette: BattlePalette,
): void => {
  const lifeRatio = Math.max(0, strike.remainingLifeMs / strike.maxLifeMs);
  const alpha = Math.min(1, lifeRatio * 1.25);
  const flickerSeed =
    strike.id * 31 + Math.floor(strike.remainingLifeMs / 35) * 7;

  // 上空からのメイン落雷（7分割）
  const startX = strike.x + hashNoise(flickerSeed) * 18;
  const startY = strike.y - 190;
  const mainBolt = buildJaggedPoints(
    startX,
    startY,
    strike.x,
    strike.y,
    7,
    22,
    flickerSeed,
  );
  drawLightningGlowPath(
    ctx,
    mainBolt,
    color,
    palette.foreground,
    12,
    4.5,
    1.8,
    alpha,
  );

  // 途中の節から斜め下へ伸びる枝分かれ稲妻（2本）
  for (const branchIdx of [2, 4] as const) {
    const origin = mainBolt[branchIdx];
    const dir = branchIdx === 2 ? -1 : 1;
    const endX =
      origin.x + dir * (28 + Math.abs(hashNoise(flickerSeed + branchIdx)) * 22);
    const endY =
      origin.y + 42 + Math.abs(hashNoise(flickerSeed + branchIdx * 3)) * 24;
    const branch = buildJaggedPoints(
      origin.x,
      origin.y,
      endX,
      endY,
      4,
      10,
      flickerSeed + branchIdx * 13,
    );
    drawLightningGlowPath(
      ctx,
      branch,
      color,
      palette.foreground,
      6,
      2.2,
      0.9,
      alpha * 0.8,
    );
  }

  // 連鎖アーク（チェインライトニング）
  for (let i = 0; i < strike.chainLines.length; i += 1) {
    const line = strike.chainLines[i];
    const chainBolt = buildJaggedPoints(
      line.fromX,
      line.fromY,
      line.toX,
      line.toY,
      5,
      12,
      flickerSeed + (i + 1) * 41,
    );
    drawLightningGlowPath(
      ctx,
      chainBolt,
      color,
      palette.foreground,
      8,
      3,
      1.2,
      alpha * 0.9,
    );
  }

  // 着弾点の呪符陣・衝撃リング・放射スパーク
  const progress = 1 - lifeRatio;
  const ringRadius = 12 + progress * 18;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(strike.x, strike.y);

  // 中心の閃光
  ctx.globalAlpha = alpha * 0.65;
  ctx.fillStyle = palette.foreground;
  ctx.beginPath();
  ctx.arc(0, 0, 7 * lifeRatio + 2, 0, Math.PI * 2);
  ctx.fill();

  // 回転する陰陽呪符四角形
  ctx.save();
  ctx.rotate(progress * 1.4);
  ctx.globalAlpha = alpha * 0.75;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const boxSize = 14 + progress * 8;
  ctx.strokeRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);
  ctx.restore();

  // 外周衝撃リング
  ctx.globalAlpha = alpha * 0.85;
  ctx.strokeStyle = palette.foreground;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 6方向の電撃スパーク線
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI * 2 * i) / 6 + hashNoise(flickerSeed + i) * 0.3;
    const r1 = ringRadius * 0.65;
    const r2 = ringRadius + 10 + Math.abs(hashNoise(flickerSeed + i * 5)) * 10;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    ctx.stroke();
  }
  ctx.restore();
};
