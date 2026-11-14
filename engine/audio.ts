import type { WeaponGenre } from "@/types";

/** 将来の Web Audio / SE 拡張に備えた抽象インターフェース */
export interface BattleAudioPort {
  readonly playWeaponFire: (genre: WeaponGenre) => void;
  readonly playHit: (isCrit: boolean) => void;
  readonly playWaveStart: (waveNumber: number) => void;
  readonly playLevelUp: () => void;
  readonly playVictory: () => void;
  readonly playDefeat: () => void;
}

const noop = (): void => {};

/** v1 用の無音（No-op）オーディオ実装 */
export const createNoopBattleAudio = (): BattleAudioPort => ({
  playWeaponFire: noop,
  playHit: noop,
  playWaveStart: noop,
  playLevelUp: noop,
  playVictory: noop,
  playDefeat: noop,
});
