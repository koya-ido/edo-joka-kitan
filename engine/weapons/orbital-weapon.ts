import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  readGenreParam,
  type EnemyEntity,
} from "@/engine/types";
import { applyEnemyDebuff } from "@/engine/weapons/debuff";
import type { WeaponMaster } from "@/types";

/** 霊珠・勾玉系（orb）の旋回座標更新と接触ダメージ判定を行う */
export const updateOrbitalWeapon = (
  weapon: WeaponMaster,
  orbAngleRad: number,
  dtMs: number,
  hitCooldownMap: Map<number, number>,
  enemies: readonly EnemyEntity[],
  damage: number,
  isCrit: boolean,
  onDamageEnemy: (enemy: EnemyEntity, damage: number, isCrit: boolean) => void,
  extraOrbCount = 0,
  rangeMultiplier = 1,
  debuffLevel = 0,
): number => {
  const orbCount = Math.max(
    1,
    readGenreParam(weapon.genreParams, "orbCount", 3) + extraOrbCount,
  );
  const orbitRadius =
    readGenreParam(weapon.genreParams, "orbitRadius", 88) *
    Math.max(0.5, rangeMultiplier);
  const angularSpeed = readGenreParam(weapon.genreParams, "angularSpeed", 2.8);
  const nextAngle = orbAngleRad + angularSpeed * (dtMs / 1000);
  const hitIntervalMs = Math.max(200, weapon.baseCooldownMs);

  for (const [enemyId, remaining] of hitCooldownMap.entries()) {
    const next = remaining - dtMs;
    if (next <= 0) hitCooldownMap.delete(enemyId);
    else hitCooldownMap.set(enemyId, next);
  }

  for (let i = 0; i < orbCount; i += 1) {
    const angle = nextAngle + ((Math.PI * 2) / orbCount) * i;
    const ox = BARRIER_CENTER_X + Math.cos(angle) * orbitRadius;
    const oy = BARRIER_CENTER_Y + Math.sin(angle) * orbitRadius;

    for (const enemy of enemies) {
      if (enemy.hp <= 0 || hitCooldownMap.has(enemy.id)) continue;
      const dist = Math.hypot(enemy.x - ox, enemy.y - oy);
      if (dist <= enemy.radius + 11) {
        hitCooldownMap.set(enemy.id, hitIntervalMs);
        applyEnemyDebuff(enemy, debuffLevel);
        onDamageEnemy(enemy, damage, isCrit);
      }
    }
  }

  return nextAngle;
};
