import type { EnemyId, EnemyMaster } from "@/types";

export const ENEMY_MASTERS: readonly EnemyMaster[] = Object.freeze([
  {
    id: "oni_imp",
    name: "小鬼",
    maxHp: 45,
    moveSpeed: 52,
    contactDamage: 8,
    expReward: 10,
    isBoss: false,
    radius: 14,
  },
  {
    id: "kappa_stray",
    name: "穢れ河童",
    maxHp: 85,
    moveSpeed: 64,
    contactDamage: 12,
    expReward: 18,
    isBoss: false,
    radius: 16,
  },
  {
    id: "boss_nue",
    name: "大妖・鵺",
    maxHp: 900,
    moveSpeed: 36,
    contactDamage: 30,
    expReward: 150,
    isBoss: true,
    radius: 28,
  },
]);

export const ENEMY_MASTER_MAP: Readonly<Record<EnemyId, EnemyMaster>> =
  Object.freeze(
    Object.fromEntries(
      ENEMY_MASTERS.map((enemy) => [enemy.id, enemy]),
    ) as Record<EnemyId, EnemyMaster>,
  );
