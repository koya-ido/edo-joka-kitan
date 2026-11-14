import type { EnemyEntity } from "@/engine/types";

const DEBUFF_DURATION_MS = 2600;

/** 敵へ移動速度低下・被ダメージ増加デバフを付与する */
export const applyEnemyDebuff = (
  enemy: EnemyEntity,
  debuffLevel: number,
): void => {
  if (debuffLevel <= 0) return;
  enemy.slowRemainingMs = DEBUFF_DURATION_MS;
  enemy.slowRatio = Math.min(0.55, 0.15 + debuffLevel * 0.1);
  enemy.vulnerableRemainingMs = DEBUFF_DURATION_MS;
  enemy.vulnerableMultiplier = 1 + debuffLevel * 0.15;
};
