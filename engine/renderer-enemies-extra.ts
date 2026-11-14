import type { BattlePalette } from "@/engine/palette";

export const drawChochinObake = (
  ctx: CanvasRenderingContext2D,
  r: number,
  bodyColor: string,
  palette: BattlePalette,
  isFlashing: boolean,
): void => {
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.86, r * 1.12, 0, 0, Math.PI * 2);
  ctx.fill();
  if (isFlashing) return;

  ctx.fillStyle = palette.surfaceDeep;
  ctx.fillRect(-r * 0.52, -r * 1.15, r * 1.04, r * 0.2);
  ctx.fillRect(-r * 0.52, r * 0.95, r * 1.04, r * 0.2);

  ctx.fillStyle = palette.foreground;
  ctx.beginPath();
  ctx.arc(0, -r * 0.22, r * 0.32, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.primary;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.45, r * 0.22, r * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
};

export const drawKashaWheel = (
  ctx: CanvasRenderingContext2D,
  r: number,
  bodyColor: string,
  palette: BattlePalette,
  elapsedMs: number,
  isFlashing: boolean,
): void => {
  const spin = elapsedMs * 0.008;
  ctx.save();
  ctx.rotate(spin);
  ctx.strokeStyle = isFlashing ? palette.foreground : palette.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
  ctx.fill();
};

export const drawGashadokuroMini = (
  ctx: CanvasRenderingContext2D,
  r: number,
  bodyColor: string,
  palette: BattlePalette,
  isFlashing: boolean,
): void => {
  ctx.fillStyle = isFlashing ? palette.foreground : palette.foreground;
  ctx.beginPath();
  ctx.arc(0, -r * 0.1, r * 0.92, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (isFlashing) return;

  ctx.fillStyle = palette.surfaceDeep;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.arc(side * r * 0.32, -r * 0.12, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = palette.hisui;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.arc(side * r * 0.32, -r * 0.12, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
};

export const drawBossShuten = (
  ctx: CanvasRenderingContext2D,
  r: number,
  bodyColor: string,
  palette: BattlePalette,
  elapsedMs: number,
  isFlashing: boolean,
): void => {
  const pulse = 1 + Math.sin(elapsedMs * 0.006) * 0.1;
  if (!isFlashing) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = palette.destructive;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = isFlashing ? palette.foreground : palette.accent;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.35, -r * 0.7);
    ctx.lineTo(side * r * 0.85, -r * 1.45);
    ctx.lineTo(side * r * 0.72, -r * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  if (isFlashing) return;

  ctx.fillStyle = palette.foreground;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.arc(side * r * 0.3, -r * 0.1, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
};

export const drawBossTamamo = (
  ctx: CanvasRenderingContext2D,
  r: number,
  bodyColor: string,
  palette: BattlePalette,
  elapsedMs: number,
  isFlashing: boolean,
): void => {
  if (!isFlashing) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = palette.magatama;
    for (let i = -2; i <= 2; i += 1) {
      const a =
        Math.PI * 0.5 + i * 0.38 + Math.sin(elapsedMs * 0.005 + i) * 0.1;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(a) * r * 0.9,
        Math.sin(a) * r * 0.9,
        r * 0.28,
        r * 0.65,
        a - Math.PI * 0.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isFlashing ? palette.foreground : palette.accent;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.25, -r * 0.7);
    ctx.lineTo(side * r * 0.65, -r * 1.38);
    ctx.lineTo(side * r * 0.72, -r * 0.52);
    ctx.closePath();
    ctx.fill();
  }
  if (isFlashing) return;

  ctx.fillStyle = palette.foreground;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.25);
  ctx.lineTo(r * 0.32, r * 0.15);
  ctx.lineTo(0, r * 0.4);
  ctx.lineTo(-r * 0.32, r * 0.15);
  ctx.closePath();
  ctx.fill();
};
