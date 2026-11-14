import { updateEnemiesMovement } from "@/engine/spawner";
import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  BARRIER_RADIUS,
  type EnemyEntity,
} from "@/engine/types";
import { describe, expect, it } from "vitest";

const makeEnemy = (distanceFromCenter: number): EnemyEntity => ({
  id: 1,
  enemyId: "oni_imp",
  name: "小鬼",
  x: BARRIER_CENTER_X,
  y: BARRIER_CENTER_Y - distanceFromCenter,
  hp: 100,
  maxHp: 100,
  moveSpeed: 60,
  contactDamage: 12,
  expReward: 10,
  isBoss: false,
  radius: 14,
  contactCooldownMs: 0,
  hitFlashMs: 0,
});

describe("engine/spawner updateEnemiesMovement", () => {
  it("deals periodic barrier damage every 1000ms while an enemy stays in contact", () => {
    const contactDist = BARRIER_RADIUS + 14;
    const enemy = makeEnemy(contactDist + 10);

    // 200ms 移動で結界へ到達し、即座に初回ダメージが発生する
    const firstDamage = updateEnemiesMovement([enemy], 200);
    expect(firstDamage).toBe(12);
    expect(enemy.contactCooldownMs).toBe(1000);

    // クールダウン中はダメージが発生しない
    const midDamage = updateEnemiesMovement([enemy], 500);
    expect(midDamage).toBe(0);
    expect(enemy.contactCooldownMs).toBe(500);

    // 合計1000ms経過で2回目の定期ダメージが発生する
    const secondDamage = updateEnemiesMovement([enemy], 500);
    expect(secondDamage).toBe(12);
    expect(enemy.contactCooldownMs).toBe(1000);

    // さらに1000ms経過で3回目の定期ダメージが発生する
    const thirdDamage = updateEnemiesMovement([enemy], 1000);
    expect(thirdDamage).toBe(12);
  });
});
