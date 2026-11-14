import {
  spawnBarrierHitParticles,
  spawnHitSparkParticles,
  spawnPurificationParticles,
  triggerScreenShake,
  updateParticlesAndShake,
} from "@/engine/particles";
import type { ParticleEntity } from "@/engine/types";
import { describe, expect, it } from "vitest";

describe("particles and screen shake", () => {
  it("通常敵撃破とボス撃破で適切な数の浄化パーティクルを生成する", () => {
    const particles: ParticleEntity[] = [];
    let seq = 1;
    const nextId = () => seq++;

    spawnPurificationParticles(particles, 100, 200, false, nextId, () => 0.5);
    expect(particles).toHaveLength(9);

    particles.length = 0;
    spawnPurificationParticles(particles, 100, 200, true, nextId, () => 0.5);
    expect(particles).toHaveLength(24);
  });

  it("ヒット火花と結界被弾パーティクルを生成し時間経過で消滅させる", () => {
    const state = {
      particles: [] as ParticleEntity[],
      shakeRemainingMs: 0,
      shakeIntensity: 0,
    };
    let seq = 1;
    const nextId = () => seq++;

    spawnHitSparkParticles(state.particles, 50, 60, true, nextId, () => 0.5);
    expect(state.particles).toHaveLength(5);

    spawnBarrierHitParticles(state.particles, 210, 492, nextId, () => 0.5);
    expect(state.particles).toHaveLength(13);

    updateParticlesAndShake(state, 100);
    expect(state.particles.length).toBe(13);

    updateParticlesAndShake(state, 500);
    expect(state.particles).toHaveLength(0);
  });

  it("画面シェイクはより強い強度を優先し、時間経過で0に減衰する", () => {
    const state = {
      particles: [] as ParticleEntity[],
      shakeRemainingMs: 0,
      shakeIntensity: 0,
    };

    triggerScreenShake(state, 5, 180);
    expect(state.shakeIntensity).toBe(5);
    expect(state.shakeRemainingMs).toBe(180);

    // 弱いシェイクで上書きされない
    triggerScreenShake(state, 2, 100);
    expect(state.shakeIntensity).toBe(5);
    expect(state.shakeRemainingMs).toBe(180);

    // 強いシェイクは優先される
    triggerScreenShake(state, 8, 300);
    expect(state.shakeIntensity).toBe(8);
    expect(state.shakeRemainingMs).toBe(300);

    updateParticlesAndShake(state, 300);
    expect(state.shakeRemainingMs).toBe(0);
    expect(state.shakeIntensity).toBe(0);
  });
});
