import { WEAPON_MASTER_MAP } from "@/data";
import { createDefaultWeaponModifier } from "@/domain";
import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  type EnemyEntity,
  type ProjectileEntity,
} from "@/engine/types";
import { updateWeaponEffects } from "@/engine/weapons/resolve-weapon";
import { fireWeaponByGenre } from "@/engine/weapons/weapon-behaviors";
import { describe, expect, it } from "vitest";

const makeEnemy = (
  id: number,
  x: number,
  y: number,
  hp = 100,
): EnemyEntity => ({
  id,
  enemyId: "oni_imp",
  name: "小鬼",
  x,
  y,
  hp,
  maxHp: hp,
  moveSpeed: 50,
  contactDamage: 8,
  expReward: 10,
  isBoss: false,
  radius: 14,
  contactCooldownMs: 0,
  hitFlashMs: 0,
});

describe("engine/weapons/projectile-effects lifetime", () => {
  it("keeps projectiles alive past durationMs until remainingPierce <= 0 or outOfBounds after bounces are spent", () => {
    const projectiles: ProjectileEntity[] = [];
    let seq = 600;
    const step = (dtMs: number): void => {
      updateWeaponEffects({
        dtMs,
        enemies: [],
        projectiles,
        slashArcs: [],
        beams: [],
        nextEntityId: () => seq++,
        onDamageEnemy: () => undefined,
      });
    };

    fireWeaponByGenre({
      weapon: WEAPON_MASTER_MAP.bow_azusa,
      damage: 20,
      isCrit: false,
      durationMs: 100,
      modifier: { ...createDefaultWeaponModifier(), bounceBonus: 3 },
      enemies: [makeEnemy(2, BARRIER_CENTER_X, BARRIER_CENTER_Y - 120, 1000)],
      projectiles,
      slashArcs: [],
      beams: [],
      nextEntityId: () => seq++,
      onDamageEnemy: () => undefined,
    });
    expect(projectiles).toHaveLength(1);
    for (let i = 0; i < 10; i += 1) {
      step(50);
    }
    expect(projectiles).toHaveLength(1);
    expect(projectiles[0].remainingLifeMs).toBeLessThanOrEqual(0);

    projectiles[0].remainingBounces = 0;
    projectiles[0].x = -100;
    step(16);
    expect(projectiles).toHaveLength(0);

    fireWeaponByGenre({
      weapon: WEAPON_MASTER_MAP.bow_azusa,
      damage: 20,
      isCrit: false,
      durationMs: 100,
      modifier: createDefaultWeaponModifier(),
      enemies: [makeEnemy(1, BARRIER_CENTER_X, 20, 1000)],
      projectiles,
      slashArcs: [],
      beams: [],
      nextEntityId: () => seq++,
      onDamageEnemy: () => undefined,
    });
    expect(projectiles).toHaveLength(1);
    projectiles[0].remainingPierce = 0;
    step(16);
    expect(projectiles).toHaveLength(0);
  });
});
