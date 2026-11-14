import { ENEMY_MASTER_MAP } from "@/data";
import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  BARRIER_RADIUS,
  BATTLE_FIELD_WIDTH,
  type EnemyEntity,
} from "@/engine/types";
import type { EnemyId, EnemyMaster, StageWaveDefinition } from "@/types";

export interface PendingSpawnTask {
  readonly enemyId: EnemyId;
  readonly delayMs: number;
}

export interface WaveSpawnerState {
  currentWave: number;
  spawnQueue: PendingSpawnTask[];
  spawnTimerMs: number;
}

/** 1ウェーブ分のスポーンキューを構築する */
export const buildWaveSpawnQueue = (
  waveDef: StageWaveDefinition,
): PendingSpawnTask[] => {
  const tasks: PendingSpawnTask[] = [];
  for (const entry of waveDef.spawns) {
    for (let i = 0; i < entry.count; i += 1) {
      tasks.push({
        enemyId: entry.enemyId,
        delayMs: entry.spawnIntervalMs,
      });
    }
  }
  return tasks;
};

/** 敵インスタンスを生成する */
export const spawnEnemyEntity = (
  id: number,
  enemyId: EnemyId,
  rng: () => number,
  enemyMap: Readonly<Record<EnemyId, EnemyMaster>> = ENEMY_MASTER_MAP,
): EnemyEntity | null => {
  if (!Object.hasOwn(enemyMap, enemyId)) {
    return null;
  }
  const master = enemyMap[enemyId];
  const margin = 40;
  const x = margin + rng() * (BATTLE_FIELD_WIDTH - margin * 2);
  return {
    id,
    enemyId: master.id,
    name: master.name,
    x,
    y: -master.radius - 8,
    hp: master.maxHp,
    maxHp: master.maxHp,
    moveSpeed: master.moveSpeed,
    contactDamage: master.contactDamage,
    expReward: master.expReward,
    isBoss: master.isBoss,
    radius: master.radius,
    contactCooldownMs: 0,
    hitFlashMs: 0,
  };
};

/** スポーンタイマーを進め、新規出現した敵を配列へ追加する */
export const advanceWaveSpawns = (
  spawner: WaveSpawnerState,
  dtMs: number,
  enemies: EnemyEntity[],
  nextEntityId: () => number,
  rng: () => number,
  enemyMap: Readonly<Record<EnemyId, EnemyMaster>> = ENEMY_MASTER_MAP,
): void => {
  if (spawner.spawnQueue.length === 0) return;

  spawner.spawnTimerMs -= dtMs;
  while (spawner.spawnQueue.length > 0 && spawner.spawnTimerMs <= 0) {
    const task = spawner.spawnQueue.shift();
    if (!task) break;
    const entity = spawnEnemyEntity(
      nextEntityId(),
      task.enemyId,
      rng,
      enemyMap,
    );
    if (entity) {
      enemies.push(entity);
    }
    const nextTask = spawner.spawnQueue[0] as PendingSpawnTask | undefined;
    spawner.spawnTimerMs += nextTask ? nextTask.delayMs : 0;
  }
};

/** 敵の結界への進軍と接触ダメージを処理し、合計被ダメージを返す */
export const updateEnemiesMovement = (
  enemies: readonly EnemyEntity[],
  dtMs: number,
): number => {
  const dtSec = dtMs / 1000;
  let totalBarrierDamage = 0;

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;

    if (enemy.hitFlashMs > 0) {
      enemy.hitFlashMs = Math.max(0, enemy.hitFlashMs - dtMs);
    }
    if (enemy.contactCooldownMs > 0) {
      enemy.contactCooldownMs = Math.max(0, enemy.contactCooldownMs - dtMs);
    }
    if (enemy.slowRemainingMs && enemy.slowRemainingMs > 0) {
      enemy.slowRemainingMs = Math.max(0, enemy.slowRemainingMs - dtMs);
    }
    if (enemy.vulnerableRemainingMs && enemy.vulnerableRemainingMs > 0) {
      enemy.vulnerableRemainingMs = Math.max(
        0,
        enemy.vulnerableRemainingMs - dtMs,
      );
    }

    const dx = BARRIER_CENTER_X - enemy.x;
    const dy = BARRIER_CENTER_Y - enemy.y;
    const dist = Math.hypot(dx, dy);
    const contactDist = BARRIER_RADIUS + enemy.radius;
    const slowFactor =
      enemy.slowRemainingMs && enemy.slowRemainingMs > 0
        ? Math.max(0.2, 1 - (enemy.slowRatio ?? 0))
        : 1;

    let currentDist = dist;
    if (dist > contactDist && dist > 0) {
      const step = Math.min(
        dist - contactDist,
        enemy.moveSpeed * slowFactor * dtSec,
      );
      enemy.x += (dx / dist) * step;
      enemy.y += (dy / dist) * step;
      currentDist = Math.hypot(
        BARRIER_CENTER_X - enemy.x,
        BARRIER_CENTER_Y - enemy.y,
      );
    }

    if (currentDist <= contactDist + 0.5 && enemy.contactCooldownMs <= 0) {
      totalBarrierDamage += enemy.contactDamage;
      enemy.contactCooldownMs = 1000;
    }
  }

  return totalBarrierDamage;
};
