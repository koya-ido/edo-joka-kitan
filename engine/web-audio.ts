import type { BattleAudioPort } from "@/engine/audio";
import type { WeaponGenre } from "@/types";

export interface WebBattleAudioPort extends BattleAudioPort {
  readonly setMuted: (muted: boolean) => void;
  readonly isMuted: () => boolean;
  readonly dispose: () => void;
}

const resolveAudioContextCtor = (): (new () => AudioContext) | null => {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    AudioContext?: new () => AudioContext;
    webkitAudioContext?: new () => AudioContext;
  };
  return win.AudioContext ?? win.webkitAudioContext ?? null;
};

const playTone = (
  ctx: AudioContext,
  freqStart: number,
  freqEnd: number,
  durationSec: number,
  type: OscillatorType,
  gainPeak: number,
  delaySec = 0,
): void => {
  const start = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, start);
  if (freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, freqEnd),
      start + durationSec,
    );
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(gainPeak, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + durationSec + 0.02);
};

const playNoiseBurst = (
  ctx: AudioContext,
  durationSec: number,
  filterType: BiquadFilterType,
  filterFreq: number,
  gainPeak: number,
): void => {
  const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainPeak, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start();
};

/** Web Audio API を使った外部アセット不要の和風シンセ効果音実装 */
export const createWebBattleAudio = (
  initialMuted = false,
): WebBattleAudioPort => {
  let muted = initialMuted;
  let audioCtx: AudioContext | null = null;
  let lastHitAt = 0;
  const lastFireAt = new Map<WeaponGenre, number>();

  const ensureContext = (): AudioContext | null => {
    if (muted) return null;
    if (!audioCtx) {
      const Ctor = resolveAudioContextCtor();
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") {
      void audioCtx.resume().catch(() => {});
    }
    return audioCtx.state === "running" ? audioCtx : null;
  };

  return {
    setMuted: (next) => {
      muted = next;
    },
    isMuted: () => muted,
    dispose: () => {
      if (audioCtx && audioCtx.state !== "closed") {
        void audioCtx.close().catch(() => {});
      }
      audioCtx = null;
    },
    playWeaponFire: (genre) => {
      const now = performance.now();
      if (now - (lastFireAt.get(genre) ?? 0) < 55) return;
      lastFireAt.set(genre, now);
      const ctx = ensureContext();
      if (!ctx) return;

      if (genre === "sword" || genre === "fan") {
        playNoiseBurst(
          ctx,
          0.08,
          "bandpass",
          genre === "sword" ? 1800 : 1200,
          0.09,
        );
      } else if (genre === "bow" || genre === "shuriken") {
        playTone(ctx, genre === "bow" ? 540 : 780, 220, 0.07, "triangle", 0.07);
      } else if (genre === "matchlock") {
        playTone(ctx, 180, 48, 0.14, "sine", 0.16);
        playNoiseBurst(ctx, 0.11, "lowpass", 900, 0.12);
      } else {
        playTone(ctx, 880, 1174, 0.11, "sine", 0.055);
      }
    },
    playHit: (isCrit) => {
      const now = performance.now();
      if (!isCrit && now - lastHitAt < 40) return;
      lastHitAt = now;
      const ctx = ensureContext();
      if (!ctx) return;

      playTone(ctx, isCrit ? 200 : 140, 58, 0.07, "sine", isCrit ? 0.13 : 0.07);
      if (isCrit) {
        playTone(ctx, 1174, 1568, 0.1, "triangle", 0.07);
      }
    },
    playWaveStart: () => {
      const ctx = ensureContext();
      if (!ctx) return;
      playTone(ctx, 587.33, 587.33, 0.22, "sine", 0.08, 0);
      playTone(ctx, 880, 880, 0.34, "sine", 0.09, 0.1);
    },
    playLevelUp: () => {
      const ctx = ensureContext();
      if (!ctx) return;
      const notes = [587.33, 739.99, 880, 1174.66];
      notes.forEach((freq, idx) => {
        playTone(ctx, freq, freq, 0.22, "triangle", 0.08, idx * 0.07);
      });
    },
    playVictory: () => {
      const ctx = ensureContext();
      if (!ctx) return;
      const notes = [587.33, 739.99, 880, 1174.66];
      notes.forEach((freq, idx) => {
        playTone(ctx, freq, freq, 0.38, "sine", 0.09, idx * 0.09);
      });
    },
    playDefeat: () => {
      const ctx = ensureContext();
      if (!ctx) return;
      const notes = [440, 349.23, 293.66];
      notes.forEach((freq, idx) => {
        playTone(ctx, freq, freq * 0.92, 0.32, "sine", 0.09, idx * 0.13);
      });
    },
  };
};
