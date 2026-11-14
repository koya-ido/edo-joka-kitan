import { WEAPON_MASTER_MAP } from "@/data";
import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  readGenreParam,
  type BeamEntity,
  type BellWaveEntity,
  type EnemyEntity,
  type ProjectileEntity,
  type SlashArcEntity,
} from "@/engine/types";
import { updateOrbitalWeapon } from "@/engine/weapons/orbital-weapon";
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

describe("engine/weapons (all 9 weapon genres)", () => {
  it("executes all 9 weapon genres and deals damage to enemies", () => {
    const weaponIds = [
      "sword_hamon",
      "bow_azusa",
      "shuriken_kaze",
      "mirror_yata",
      "talisman_goou",
      "matchlock_tanegashima",
      "fan_tengu",
      "bell_kagura",
    ] as const;

    for (const weaponId of weaponIds) {
      const weapon = WEAPON_MASTER_MAP[weaponId];
      const enemy = makeEnemy(1, BARRIER_CENTER_X, BARRIER_CENTER_Y - 100, 200);
      const enemies = [enemy];
      const projectiles: ProjectileEntity[] = [];
      const slashArcs: SlashArcEntity[] = [];
      const beams: BeamEntity[] = [];
      const bellWaves: BellWaveEntity[] = [];
      let seq = 1;
      let totalDmg = 0;

      const fired = fireWeaponByGenre({
        weapon,
        damage: 30,
        isCrit: false,
        durationMs: Math.max(400, weapon.baseDurationMs),
        enemies,
        projectiles,
        slashArcs,
        beams,
        bellWaves,
        nextEntityId: () => seq++,
        onDamageEnemy: (target, dmg) => {
          target.hp -= dmg;
          totalDmg += dmg;
        },
      });

      expect(fired).toBe(true);

      for (let step = 0; step < 30; step += 1) {
        updateWeaponEffects({
          dtMs: 30,
          enemies,
          projectiles,
          slashArcs,
          beams,
          bellWaves,
          onDamageEnemy: (target, dmg) => {
            target.hp -= dmg;
            totalDmg += dmg;
          },
        });
      }

      expect(totalDmg).toBeGreaterThan(0);
      if (weapon.genre === "fan") {
        expect(enemy.y).toBeLessThan(BARRIER_CENTER_Y - 100);
      }
    }
  });

  it("orbits and damages nearby enemies with orb genre", () => {
    const orbWeapon = WEAPON_MASTER_MAP.orb_magatama;
    const orbitRadius = readGenreParam(
      orbWeapon.genreParams,
      "orbitRadius",
      88,
    );
    const enemy = makeEnemy(
      1,
      BARRIER_CENTER_X + orbitRadius,
      BARRIER_CENTER_Y,
      100,
    );
    const cooldowns = new Map<number, number>();
    let totalDmg = 0;

    let angle = 0;
    for (let i = 0; i < 60; i += 1) {
      angle = updateOrbitalWeapon(
        orbWeapon,
        angle,
        16,
        cooldowns,
        [enemy],
        15,
        false,
        (target, dmg) => {
          target.hp -= dmg;
          totalDmg += dmg;
        },
      );
    }

    expect(totalDmg).toBeGreaterThan(0);
  });
});
