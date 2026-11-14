import {
  BATTLE_FIELD_HEIGHT,
  BATTLE_FIELD_WIDTH,
  type BeamSegment,
} from "@/engine/types";

const EPSILON = 1e-6;
const DEFAULT_MAX_TOTAL_SPREAD_DEG = 130;

/** 偶数本でも i - Math.floor(count / 2) で1本が基準角(offset=0)を通る扇状角度配列を返す */
export const computeFanAngles = (
  baseAngle: number,
  count: number,
  spreadDeg: number,
  maxTotalSpreadDeg = DEFAULT_MAX_TOTAL_SPREAD_DEG,
): readonly number[] => {
  const safeCount = Math.max(1, count);
  const rawTotalDeg = spreadDeg * (safeCount - 1);
  const effectiveSpreadDeg =
    safeCount > 1 && rawTotalDeg > maxTotalSpreadDeg
      ? maxTotalSpreadDeg / (safeCount - 1)
      : spreadDeg;
  const spreadRad = (effectiveSpreadDeg * Math.PI) / 180;
  const centerIndex = Math.floor(safeCount / 2);
  const angles: number[] = [];
  for (let i = 0; i < safeCount; i += 1) {
    angles.push(baseAngle + (i - centerIndex) * spreadRad);
  }
  return angles;
};

/** 始点から角度方向へ壁面反射を繰り返す線分列を算出する */
export const computeWallBounceSegments = (
  originX: number,
  originY: number,
  angleRad: number,
  maxBounces: number,
): readonly BeamSegment[] => {
  const segments: BeamSegment[] = [];
  let x = originX;
  let y = originY;
  let dx = Math.cos(angleRad);
  let dy = Math.sin(angleRad);
  const bounces = Math.max(0, Math.floor(maxBounces));

  for (let step = 0; step <= bounces; step += 1) {
    const tx =
      dx > EPSILON
        ? (BATTLE_FIELD_WIDTH - x) / dx
        : dx < -EPSILON
          ? (0 - x) / dx
          : Number.POSITIVE_INFINITY;
    const ty =
      dy > EPSILON
        ? (BATTLE_FIELD_HEIGHT - y) / dy
        : dy < -EPSILON
          ? (0 - y) / dy
          : Number.POSITIVE_INFINITY;
    const t = Math.max(EPSILON, Math.min(tx, ty));
    const nx = Math.max(0, Math.min(BATTLE_FIELD_WIDTH, x + dx * t));
    const ny = Math.max(0, Math.min(BATTLE_FIELD_HEIGHT, y + dy * t));
    segments.push({ x1: x, y1: y, x2: nx, y2: ny });

    if (step >= bounces) break;
    const hitVertical = tx <= ty + EPSILON;
    const hitHorizontal = ty <= tx + EPSILON;
    if (hitVertical) dx = -dx;
    if (hitHorizontal) dy = -dy;
    x = nx + dx * 0.5;
    y = ny + dy * 0.5;
  }
  return segments;
};

/** 点と線分の最短距離を返す */
export const pointToSegmentDistance = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number => {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const lenSq = vx * vx + vy * vy;
  if (lenSq <= EPSILON) return Math.hypot(px - x1, py - y1);
  const proj = ((px - x1) * vx + (py - y1) * vy) / lenSq;
  const clamped = Math.max(0, Math.min(1, proj));
  return Math.hypot(px - (x1 + vx * clamped), py - (y1 + vy * clamped));
};
