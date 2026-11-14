import type { BattlePalette } from "@/engine/palette";
import type { ProjectileEntity } from "@/engine/types";

/** 弓矢系・手裏剣系・呪符系・火縄銃系の飛翔弾を描画する */
export const drawProjectileByGenre = (
  ctx: CanvasRenderingContext2D,
  p: ProjectileEntity,
  color: string,
  palette: BattlePalette,
): void => {
  const angle = Math.atan2(p.vy, p.vx);
  ctx.save();
  ctx.translate(p.x, p.y);

  switch (p.genre) {
    case "sword": {
      ctx.rotate(angle);
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(-p.radius * 0.3, 0, p.radius, -Math.PI * 0.42, Math.PI * 0.42);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(-p.radius * 0.3, 0, p.radius, -Math.PI * 0.38, Math.PI * 0.38);
      ctx.stroke();

      ctx.strokeStyle = palette.foreground;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(-p.radius * 0.3, 0, p.radius + 1, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.stroke();
      break;
    }
    case "bow": {
      ctx.rotate(angle);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-4, 0);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(3, -4);
      ctx.lineTo(5, 0);
      ctx.lineTo(3, 4);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "shuriken": {
      const spin = (p.remainingLifeMs * 0.025) % (Math.PI * 2);
      ctx.rotate(spin);
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 4; i += 1) {
        const a = (Math.PI / 2) * i;
        ctx.lineTo(Math.cos(a) * 8, Math.sin(a) * 8);
        ctx.lineTo(
          Math.cos(a + Math.PI / 4) * 2.5,
          Math.sin(a + Math.PI / 4) * 2.5,
        );
      }
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = palette.surfaceDeep;
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "talisman": {
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.strokeStyle = palette.foreground;
      ctx.lineWidth = 1.2;
      ctx.fillRect(-8, -4.5, 16, 9);
      ctx.strokeRect(-8, -4.5, 16, 9);

      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(4, 0);
      ctx.stroke();
      break;
    }
    case "matchlock": {
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(-16, -2.5);
      ctx.lineTo(0, -p.radius * 0.7);
      ctx.lineTo(0, p.radius * 0.7);
      ctx.lineTo(-16, 2.5);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = palette.foreground;
      ctx.beginPath();
      ctx.arc(1.5, 0, p.radius * 0.42, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
};
