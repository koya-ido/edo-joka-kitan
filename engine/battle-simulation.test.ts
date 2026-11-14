import { CHARACTER_MASTERS, WEAPON_MASTER_MAP } from "@/data";
import { createDefaultWeaponModifier, createInitialPlayerSave } from "@/domain";
import { createNoopBattleAudio } from "@/engine/audio";
import { advanceCombatSimulation } from "@/engine/battle-simulation";
import type { WeaponBurstState } from "@/engine/battle-state";
import { resolveCharacterPassive } from "@/engine/damage";
import {
  BARRIER_CENTER_X,
  BARRIER_CENTER_Y,
  type EnemyEntity,
  type SlashArcEntity,
} from "@/engine/types";
import type { InGameBuffState, WeaponId, WeaponModifierState } from "@/types";
import { describe, expect, it } from "vitest";

const makeEnemy = (hp = 10000): EnemyEntity => ({
  id: 1,
  enemyId: "oni_imp",
  name: "小鬼",
  x: BARRIER_CENTER_X + 60,
  y: BARRIER_CENTER_Y,
  hp,
  maxHp: hp,
  moveSpeed: 0,
  contactDamage: 0,
  expReward: 10,
  isBoss: false,
  radius: 14,
  contactCooldownMs: 0,
  hitFlashMs: 0,
});

describe("engine/battle-simulation sword combo burst", () => {
  it("triggers additional combo slashes after initial sword attack", () => {
    const save = createInitialPlayerSave();
    const enemy = makeEnemy(10000);
    const slashArcs: SlashArcEntity[] = [];
    const weaponCooldowns = new Map<WeaponId, number>([["sword_hamon", 0]]);
    const weaponBursts = new Map<WeaponId, WeaponBurstState>();
    const mod: WeaponModifierState = {
      ...createDefaultWeaponModifier(),
      comboBonus: 2,
    };
    const buffState: InGameBuffState = {
      atkMultiplier: 1,
      critRateBonusPct: 0,
      critDamageMultiplier: 1.5,
      unlockedWeaponIds: ["sword_hamon"],
      weaponModifiers: {
        sword_hamon: mod,
      },
    };

    let seq = 10;
    let hitCount = 0;

    const stepOnce = (dtMs: number): void => {
      advanceCombatSimulation({
        dtMs,
        save,
        metaStats: { hp: 120, atk: 20, luk: 0 },
        passive: resolveCharacterPassive(CHARACTER_MASTERS[0], 0),
        buffState,
        weaponMap: WEAPON_MASTER_MAP,
        audio: createNoopBattleAudio(),
        rng: () => 0.99,
        enemies: [enemy],
        projectiles: [],
        slashArcs,
        beams: [],
        talismanStrikes: [],
        floatingTexts: [],
        weaponCooldowns,
        weaponBursts,
        orbAngles: new Map(),
        orbHitCooldowns: new Map(),
        nextEntityId: () => {
          seq += 1;
          return seq;
        },
        onDamageEnemy: (target, dmg) => {
          target.hp -= dmg;
          hitCount += 1;
        },
      });
    };

    // 初回攻撃（クールダウン0、連撃中はクールダウン未開始）
    stepOnce(16);
    expect(hitCount).toBe(1);
    expect(weaponBursts.get("sword_hamon")?.remaining).toBe(2);
    expect(weaponCooldowns.get("sword_hamon")).toBe(0);

    // 110ms 経過で連撃1回目（まだクールダウン未開始）
    stepOnce(110);
    expect(hitCount).toBe(2);
    expect(weaponBursts.get("sword_hamon")?.remaining).toBe(1);
    expect(weaponCooldowns.get("sword_hamon")).toBe(0);

    // さらに 110ms 経過で連撃2回目（計3回斬撃・バースト終了後にクールダウン開始）
    stepOnce(110);
    expect(hitCount).toBe(3);
    expect(weaponBursts.has("sword_hamon")).toBe(false);
    expect(weaponCooldowns.get("sword_hamon")).toBe(
      WEAPON_MASTER_MAP.sword_hamon.baseCooldownMs,
    );
  });

  it("fires bow projectiles sequentially using extraProjectiles as rapid-fire burst", () => {
    const mod = { ...createDefaultWeaponModifier(), extraProjectiles: 2 };
    const buffState: InGameBuffState = {
      atkMultiplier: 1,
      critRateBonusPct: 0,
      critDamageMultiplier: 1.5,
      unlockedWeaponIds: ["bow_azusa"],
      weaponModifiers: {
        bow_azusa: mod,
      } as unknown as Record<WeaponId, WeaponModifierState>,
    };
    const save = createInitialPlayerSave();
    const enemy = makeEnemy(10000);
    const projectiles: Parameters<
      typeof advanceCombatSimulation
    >[0]["projectiles"] = [];
    const weaponCooldowns = new Map<WeaponId, number>([["bow_azusa", 0]]);
    const weaponBursts = new Map<WeaponId, WeaponBurstState>();
    let seq = 1;

    const stepBow = (dtMs: number): void => {
      advanceCombatSimulation({
        dtMs,
        save,
        metaStats: { hp: 120, atk: 20, luk: 0 },
        passive: resolveCharacterPassive(CHARACTER_MASTERS[0], 0),
        buffState,
        weaponMap: WEAPON_MASTER_MAP,
        audio: createNoopBattleAudio(),
        rng: () => 0.99,
        enemies: [enemy],
        projectiles,
        slashArcs: [],
        beams: [],
        talismanStrikes: [],
        floatingTexts: [],
        weaponCooldowns,
        weaponBursts,
        orbAngles: new Map(),
        orbHitCooldowns: new Map(),
        nextEntityId: () => ++seq,
        onDamageEnemy: () => {},
      });
    };

    stepBow(16);
    expect(projectiles).toHaveLength(1);
    expect(weaponBursts.get("bow_azusa")?.remaining).toBe(2);

    stepBow(110);
    expect(projectiles).toHaveLength(2);

    stepBow(110);
    expect(projectiles).toHaveLength(3);
    expect(weaponBursts.has("bow_azusa")).toBe(false);
  });
});
