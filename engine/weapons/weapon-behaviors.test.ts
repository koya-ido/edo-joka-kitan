import { WEAPON_MASTER_MAP } from "@/data";
import { createDefaultWeaponModifier } from "@/domain";
import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  readGenreParam,
  type BeamEntity,
  type EnemyEntity,
  type ProjectileEntity,
  type SlashArcEntity,
  type TalismanStrikeEntity,
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

describe("engine/weapons (all 8 weapon genres)", () => {
  it("executes all 8 weapon genres and deals damage to enemies", () => {
    const weaponIds = [
      "sword_hamon",
      "bow_azusa",
      "shuriken_kaze",
      "mirror_yata",
      "talisman_goou",
      "matchlock_tanegashima",
      "fan_tengu",
    ] as const;

    for (const weaponId of weaponIds) {
      const weapon = WEAPON_MASTER_MAP[weaponId];
      const enemy = makeEnemy(1, BARRIER_CENTER_X, BARRIER_CENTER_Y - 100, 200);
      const enemies = [enemy];
      const projectiles: ProjectileEntity[] = [];
      const slashArcs: SlashArcEntity[] = [];
      const beams: BeamEntity[] = [];
      const talismanStrikes: TalismanStrikeEntity[] = [];
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
        talismanStrikes,
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
          talismanStrikes,
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

  it("expands sword range and fires piercing slash wave projectile when enabled", () => {
    const sword = WEAPON_MASTER_MAP.sword_hamon;
    const farEnemy = makeEnemy(
      1,
      BARRIER_CENTER_X,
      BARRIER_CENTER_Y - 190,
      100,
    );
    const secondEnemy = makeEnemy(
      2,
      BARRIER_CENTER_X,
      BARRIER_CENTER_Y - 250,
      100,
    );
    const enemies = [farEnemy, secondEnemy];
    const projectiles: ProjectileEntity[] = [];
    const slashArcs: SlashArcEntity[] = [];
    let seq = 1;

    const fired = fireWeaponByGenre({
      weapon: sword,
      damage: 25,
      isCrit: false,
      durationMs: 280,
      rangeMultiplier: 1.5,
      slashWave: {
        enabled: true,
        sizeMultiplier: 1.3,
        pierceBonus: 2,
      },
      enemies,
      projectiles,
      slashArcs,
      beams: [],
      nextEntityId: () => seq++,
      onDamageEnemy: (target, dmg) => {
        target.hp -= dmg;
      },
    });

    expect(fired).toBe(true);
    expect(slashArcs).toHaveLength(1);
    expect(slashArcs[0].range).toBeCloseTo(240, 6);
    expect(projectiles).toHaveLength(1);
    expect(projectiles[0].genre).toBe("sword");
    expect(projectiles[0].remainingPierce).toBe(3);
    expect(projectiles[0].radius).toBeCloseTo(14 * 1.3 * 1.5, 6);

    // 斬撃波が飛翔して2体目の敵にも貫通命中することを確認
    for (let step = 0; step < 30; step += 1) {
      updateWeaponEffects({
        dtMs: 30,
        enemies,
        projectiles,
        slashArcs,
        beams: [],
        onDamageEnemy: (target, dmg) => {
          target.hp -= dmg;
        },
      });
    }
    expect(secondEnemy.hp).toBeLessThan(100);
  });

  it("applies pierceBonus, bounceBonus, and splitEnabled (with splitPierce/Bounce) to bow", () => {
    const enemies = [
      makeEnemy(1, BARRIER_CENTER_X, BARRIER_CENTER_Y - 80, 1000),
    ];
    const projectiles: ProjectileEntity[] = [];
    let seq = 500;
    const mod = {
      ...createDefaultWeaponModifier(),
      pierceBonus: 1,
      bounceBonus: 2,
      splitEnabled: true,
      splitPierceBonus: 2,
      splitBounceBonus: 1,
      explosionEnabled: true,
      explosionRadiusMultiplier: 1.5,
    };

    const fired = fireWeaponByGenre({
      weapon: WEAPON_MASTER_MAP.bow_azusa,
      damage: 40,
      isCrit: false,
      durationMs: 1200,
      modifier: mod,
      enemies,
      projectiles,
      slashArcs: [],
      beams: [],
      nextEntityId: () => seq++,
      onDamageEnemy: (target, dmg) => {
        target.hp -= dmg;
      },
    });

    expect(fired).toBe(true);
    expect(projectiles).toHaveLength(1);
    expect(projectiles[0].remainingPierce).toBe(4);
    expect(projectiles[0].remainingBounces).toBe(2);
    expect(projectiles[0].splitCount).toBe(2);
    expect(projectiles[0].explosionRadius).toBeCloseTo(48 * 1.5, 6);

    for (let step = 0; step < 10; step += 1) {
      updateWeaponEffects({
        dtMs: 30,
        enemies,
        projectiles,
        slashArcs: [],
        beams: [],
        nextEntityId: () => seq++,
        onDamageEnemy: (target, dmg) => {
          target.hp -= dmg;
        },
      });
    }
    expect(enemies[0].hp).toBeLessThan(1000);
    // 敵命中で反射回数は減少しないこと、分裂子弾が生成されて splitPierce/splitBounce を継承すること
    expect(projectiles.length).toBeGreaterThan(1);
    const child = projectiles.find((p) => p.id > 500);
    expect(child).toBeDefined();
    expect(child?.remainingPierce).toBe(3);
    expect(child?.remainingBounces).toBe(1);
    expect(child?.splitCount).toBe(0);
  });

  it("summons talisman strike directly at enemy with chain and debuff, and multi-target mirror beams bounce", () => {
    const e1 = makeEnemy(1, BARRIER_CENTER_X, BARRIER_CENTER_Y - 90, 200);
    const e2 = makeEnemy(2, BARRIER_CENTER_X + 35, BARRIER_CENTER_Y - 95, 200);
    const enemies = [e1, e2];
    const talismanStrikes: TalismanStrikeEntity[] = [];
    let seq = 700;

    const firedTalisman = fireWeaponByGenre({
      weapon: WEAPON_MASTER_MAP.talisman_goou,
      damage: 40,
      isCrit: false,
      durationMs: 650,
      modifier: {
        ...createDefaultWeaponModifier(),
        chainBonus: 1,
        debuffLevel: 2,
      },
      enemies,
      projectiles: [],
      slashArcs: [],
      beams: [],
      talismanStrikes,
      nextEntityId: () => seq++,
      onDamageEnemy: (target, dmg) => {
        target.hp -= dmg;
      },
    });
    expect(firedTalisman).toBe(true);
    expect(talismanStrikes).toHaveLength(1);
    expect(e1.hp).toBe(160);
    expect(e2.hp).toBe(170);
    expect(e1.slowRemainingMs).toBeGreaterThan(0);
    expect(e2.vulnerableMultiplier).toBeCloseTo(1.3, 6);

    const beams: BeamEntity[] = [];
    const firedMirror = fireWeaponByGenre({
      weapon: WEAPON_MASTER_MAP.mirror_yata,
      damage: 20,
      isCrit: false,
      durationMs: 900,
      modifier: {
        ...createDefaultWeaponModifier(),
        extraProjectiles: 1,
        bounceBonus: 1,
      },
      enemies,
      projectiles: [],
      slashArcs: [],
      beams,
      nextEntityId: () => seq++,
      onDamageEnemy: (target, dmg) => {
        target.hp -= dmg;
      },
    });
    expect(firedMirror).toBe(true);
    expect(beams).toHaveLength(2);
    expect(beams[0].bounceRemaining).toBe(1);
  });

  it("spawns split projectiles at completely random angles via rng", () => {
    const enemies = [
      makeEnemy(1, BARRIER_CENTER_X, BARRIER_CENTER_Y - 12, 1000),
    ];
    const projectiles: ProjectileEntity[] = [];
    let seq = 800;
    const rngValues = [0.25, 0.75];
    let rngIdx = 0;

    fireWeaponByGenre({
      weapon: WEAPON_MASTER_MAP.bow_azusa,
      damage: 40,
      isCrit: false,
      durationMs: 1200,
      modifier: { ...createDefaultWeaponModifier(), splitEnabled: true },
      enemies,
      projectiles,
      slashArcs: [],
      beams: [],
      nextEntityId: () => seq++,
      onDamageEnemy: () => {},
    });

    updateWeaponEffects({
      dtMs: 16,
      enemies,
      projectiles,
      slashArcs: [],
      beams: [],
      nextEntityId: () => seq++,
      rng: () => rngValues[rngIdx++] ?? 0,
      onDamageEnemy: () => {},
    });

    const children = projectiles.filter((p) => p.id > 800);
    expect(children).toHaveLength(2);
    expect(Math.atan2(children[0].vy, children[0].vx)).toBeCloseTo(
      Math.PI * 0.5,
      5,
    );
    expect(Math.atan2(children[1].vy, children[1].vx)).toBeCloseTo(
      -Math.PI * 0.5,
      5,
    );
    expect(children[0].radius).toBeCloseTo(6 * 0.75, 5);
    expect(children[0].visualScale).toBeCloseTo(0.75, 5);
  });

  it("deals 75% chain damage for mirror beams", () => {
    const e1 = makeEnemy(1, BARRIER_CENTER_X, BARRIER_CENTER_Y - 90, 200);
    const e2 = makeEnemy(2, BARRIER_CENTER_X + 35, BARRIER_CENTER_Y - 95, 200);
    const enemies = [e1, e2];
    const beams: BeamEntity[] = [];
    let seq = 900;

    fireWeaponByGenre({
      weapon: WEAPON_MASTER_MAP.mirror_yata,
      damage: 40,
      isCrit: false,
      durationMs: 900,
      modifier: {
        ...createDefaultWeaponModifier(),
        bounceBonus: 1,
      },
      enemies,
      projectiles: [],
      slashArcs: [],
      beams,
      nextEntityId: () => seq++,
      onDamageEnemy: () => {},
    });

    beams[0].tickTimerMs = 0;
    updateWeaponEffects({
      dtMs: 16,
      enemies,
      projectiles: [],
      slashArcs: [],
      beams,
      nextEntityId: () => seq++,
      onDamageEnemy: (target, dmg) => {
        target.hp -= dmg;
      },
    });

    expect(e1.hp).toBe(160);
    expect(e2.hp).toBe(170);
  });
});
