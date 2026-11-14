import type { ParticleColorKey, ParticleEntity } from "@/engine/types";

export interface ScreenShakeState {
  shakeRemainingMs: number;
  shakeIntensity: number;
}

export interface ParticleAndShakeState extends ScreenShakeState {
  readonly particles: ParticleEntity[];
}

const MAX_PARTICLES = 180;

const pushParticle = (
  particles: ParticleEntity[],
  particle: ParticleEntity,
): void => {
  if (particles.length >= MAX_PARTICLES) {
    particles.shift();
  }
  particles.push(particle);
};

/** 画面シェイクを発火する（より強い揺れ・長い時間を優先） */
export const triggerScreenShake = (
  state: ScreenShakeState,
  intensity: number,
  durationMs: number,
): void => {
  if (intensity <= 0 || durationMs <= 0) return;
  if (state.shakeRemainingMs <= 0 || intensity >= state.shakeIntensity) {
    state.shakeIntensity = intensity;
  }
  state.shakeRemainingMs = Math.max(state.shakeRemainingMs, durationMs);
};

/** 敵撃破時の浄化パーティクルを生成する */
export const spawnPurificationParticles = (
  particles: ParticleEntity[],
  x: number,
  y: number,
  isBoss: boolean,
  nextEntityId: () => number,
  rng: () => number = Math.random,
): void => {
  const count = isBoss ? 24 : 9;
  const colors: readonly ParticleColorKey[] = isBoss
    ? ["hisui", "magatama", "accent", "foreground"]
    : ["hisui", "exp", "foreground"];

  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + (rng() - 0.5) * 0.4;
    const speed = (isBoss ? 75 : 45) + rng() * (isBoss ? 110 : 65);
    const maxLifeMs = (isBoss ? 520 : 380) + rng() * 180;
    pushParticle(particles, {
      id: nextEntityId(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 20,
      size: (isBoss ? 3.5 : 2.5) + rng() * 2.5,
      colorKey: colors[i % colors.length],
      gravity: -55,
      remainingLifeMs: maxLifeMs,
      maxLifeMs,
    });
  }
};

/** 攻撃ヒット時の火花パーティクル（クリティカル時は増量） */
export const spawnHitSparkParticles = (
  particles: ParticleEntity[],
  x: number,
  y: number,
  isCrit: boolean,
  nextEntityId: () => number,
  rng: () => number = Math.random,
): void => {
  const count = isCrit ? 5 : 2;
  for (let i = 0; i < count; i += 1) {
    const angle = rng() * Math.PI * 2;
    const speed = (isCrit ? 85 : 50) + rng() * 60;
    const maxLifeMs = isCrit ? 260 : 180;
    pushParticle(particles, {
      id: nextEntityId(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: isCrit ? 3 : 2,
      colorKey: isCrit ? "accent" : "foreground",
      gravity: 40,
      remainingLifeMs: maxLifeMs,
      maxLifeMs,
    });
  }
};

/** 結界被弾時の衝撃パーティクルを生成する */
export const spawnBarrierHitParticles = (
  particles: ParticleEntity[],
  x: number,
  y: number,
  nextEntityId: () => number,
  rng: () => number = Math.random,
): void => {
  for (let i = 0; i < 8; i += 1) {
    const angle = -Math.PI * rng();
    const speed = 55 + rng() * 75;
    const maxLifeMs = 320 + rng() * 120;
    pushParticle(particles, {
      id: nextEntityId(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2.5 + rng() * 2,
      colorKey: i % 2 === 0 ? "destructive" : "primary",
      gravity: 90,
      remainingLifeMs: maxLifeMs,
      maxLifeMs,
    });
  }
};

/** パーティクルの位置・速度・寿命と画面シェイクを更新する */
export const updateParticlesAndShake = (
  state: ParticleAndShakeState,
  dtMs: number,
): void => {
  const dtSec = dtMs / 1000;
  const damping = Math.pow(0.92, dtMs / 16.67);

  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const p = state.particles[i];
    p.x += p.vx * dtSec;
    p.y += p.vy * dtSec;
    p.vx *= damping;
    p.vy = p.vy * damping + p.gravity * dtSec;
    p.remainingLifeMs -= dtMs;
    if (p.remainingLifeMs <= 0) {
      state.particles.splice(i, 1);
    }
  }

  if (state.shakeRemainingMs > 0) {
    state.shakeRemainingMs = Math.max(0, state.shakeRemainingMs - dtMs);
    if (state.shakeRemainingMs === 0) {
      state.shakeIntensity = 0;
    }
  }
};
