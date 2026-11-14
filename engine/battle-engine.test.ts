import { createInitialPlayerSave, prepareBattleSession } from "@/domain";
import { createBattleEngine, PREPARING_DURATION_MS } from "@/engine";
import type { StageMaster } from "@/types";
import { describe, expect, it, vi } from "vitest";

const makeShortStage = (): StageMaster => ({
  id: "stage_1_bamboo",
  order: 1,
  name: "テスト節",
  description: "テスト",
  corruptionLevel: 100,
  unlockRequirementStageId: null,
  waves: Array.from({ length: 10 }, (_, idx) => ({
    waveNumber: idx + 1,
    spawns: [
      {
        enemyId: idx === 9 ? "boss_nue" : "oni_imp",
        count: 1,
        spawnIntervalMs: 10,
        isBoss: idx === 9,
      },
    ],
  })),
  clearReward: { magatama: 100, hisui: 2 },
  firstClearBonusHisui: 5,
});

describe("engine/battle-engine (loop, phases, speed, pause, error safety)", () => {
  it("transitions preparing -> playing, supports pause/resume, 2x speed, and 3-slot cap", () => {
    const save = createInitialPlayerSave();
    const launch = prepareBattleSession(save, "stage_1_bamboo");
    expect(launch.ok).toBe(true);
    if (!launch.ok) return;

    const engine = createBattleEngine({
      launchContext: launch.data,
      rng: () => 0.5,
    });

    expect(engine.getViewState().hud.phase).toBe("preparing");
    for (let t = 0; t < PREPARING_DURATION_MS; t += 50) {
      engine.step(50);
    }
    expect(engine.getViewState().hud.phase).toBe("playing");

    engine.pause();
    expect(engine.getViewState().hud.phase).toBe("paused");
    engine.step(50);
    expect(engine.getViewState().hud.phase).toBe("paused");

    engine.resume();
    expect(engine.getViewState().hud.phase).toBe("playing");
    engine.setGameSpeed(2);
    expect(engine.getViewState().hud.gameSpeed).toBe(2);

    expect(engine.unlockWeaponInRun("bow_azusa")).toBe(true);
    expect(engine.unlockWeaponInRun("shuriken_kaze")).toBe(true);
    expect(engine.unlockWeaponInRun("fan_tengu")).toBe(false); // max 3 slots
    expect(engine.getViewState().buffState.unlockedWeaponIds).toHaveLength(3);
  });

  it("reaches victory when all 10 waves are cleared", () => {
    const save = createInitialPlayerSave();
    const launch = prepareBattleSession(save, "stage_1_bamboo");
    expect(launch.ok).toBe(true);
    if (!launch.ok) return;

    const boosted = {
      ...launch.data,
      metaStats: { hp: 500, atk: 2000, luk: 100 },
    };

    const engine = createBattleEngine({
      launchContext: boosted,
      stageOverride: makeShortStage(),
      rng: () => 0.5,
    });

    engine.setGameSpeed(2);
    for (let i = 0; i < 4000; i += 1) {
      engine.step(50);
      const current = engine.getViewState();
      if (current.hud.phase === "level_up_modal") {
        const firstChoice = current.hud.pendingUpgradeChoices[0];
        engine.applyUpgradeChoice(firstChoice.id);
      }
      if (engine.getViewState().hud.phase === "victory") break;
    }

    expect(engine.getViewState().hud.phase).toBe("victory");
    expect(engine.getViewState().hud.currentWave).toBe(10);
  });

  it("pauses into level_up_modal on EXP threshold, supports reroll, and resumes playing on choice", () => {
    const save = createInitialPlayerSave();
    const launch = prepareBattleSession(save, "stage_1_bamboo");
    expect(launch.ok).toBe(true);
    if (!launch.ok) return;

    const boosted = {
      ...launch.data,
      metaStats: { hp: 500, atk: 2000, luk: 100 },
    };

    const engine = createBattleEngine({
      launchContext: boosted,
      stageOverride: makeShortStage(),
      rng: () => 0.4,
    });

    engine.setGameSpeed(2);
    for (let i = 0; i < 2000; i += 1) {
      engine.step(50);
      if (engine.getViewState().hud.phase === "level_up_modal") break;
    }

    const modalState = engine.getViewState();
    expect(modalState.hud.phase).toBe("level_up_modal");
    expect(modalState.hud.pendingUpgradeChoices.length).toBeGreaterThan(0);

    engine.rerollUpgradeChoices();
    expect(engine.getViewState().hud.phase).toBe("level_up_modal");

    const chosen = engine.getViewState().hud.pendingUpgradeChoices[0];
    expect(chosen).toBeDefined();
    expect(engine.applyUpgradeChoice(chosen.id)).toBe(true);
    expect(engine.getViewState().hud.phase).toBe("playing");
  });

  it("reaches defeat when barrierHp drops to 0", () => {
    const save = createInitialPlayerSave();
    const launch = prepareBattleSession(save, "stage_1_bamboo");
    expect(launch.ok).toBe(true);
    if (!launch.ok) return;

    const fragile = {
      ...launch.data,
      metaStats: { hp: 5, atk: 0, luk: 0 },
    };

    const engine = createBattleEngine({
      launchContext: fragile,
      rng: () => 0.5,
    });

    engine.setGameSpeed(2);
    for (let i = 0; i < 2000; i += 1) {
      engine.step(50);
      if (engine.getViewState().hud.phase === "defeat") break;
    }

    expect(engine.getViewState().hud.phase).toBe("defeat");
    expect(engine.getViewState().hud.barrierHp).toBe(0);
  });

  it("stops safely and notifies onFatalError when canvas rendering throws", () => {
    const save = createInitialPlayerSave();
    const launch = prepareBattleSession(save, "stage_1_bamboo");
    expect(launch.ok).toBe(true);
    if (!launch.ok) return;

    const onFatalError = vi.fn();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const engine = createBattleEngine({
      launchContext: launch.data,
      callbacks: { onFatalError },
    });

    const brokenCtx = {
      fillRect: () => {
        throw new Error("Simulated Canvas GPU error");
      },
    } as unknown as CanvasRenderingContext2D;

    engine.attachCanvas(brokenCtx);
    engine.step(16);
    expect(onFatalError).toHaveBeenCalledWith("戦闘処理で問題が発生しました。");

    errorSpy.mockRestore();
  });

  it("handles initial weapon selection: 1 owned -> preparing immediately, 2 owned -> 2 choices, 3+ owned -> 3 choices", () => {
    const base = createInitialPlayerSave();
    const nowIso = "2026-11-15T00:00:00.000Z";

    // 2 weapons -> 2 choices in selecting_initial_weapon
    const twoSave = {
      ...base,
      ownedWeapons: {
        ...base.ownedWeapons,
        bow_azusa: {
          weaponId: "bow_azusa" as const,
          refineLevel: 0,
          obtainedAt: nowIso,
        },
      },
    };
    const twoLaunch = prepareBattleSession(twoSave, "stage_1_bamboo");
    expect(twoLaunch.ok).toBe(true);
    if (!twoLaunch.ok) return;
    const engine2 = createBattleEngine({ launchContext: twoLaunch.data });
    const view2 = engine2.getViewState();
    expect(view2.hud.phase).toBe("selecting_initial_weapon");
    expect(view2.hud.pendingUpgradeChoices).toHaveLength(2);
    expect(view2.buffState.unlockedWeaponIds).toEqual([]);

    const chosenId = view2.hud.pendingUpgradeChoices[0].id;
    expect(engine2.applyUpgradeChoice(chosenId)).toBe(true);
    expect(engine2.getViewState().hud.phase).toBe("preparing");
    expect(engine2.getViewState().buffState.unlockedWeaponIds).toHaveLength(1);

    // 4 weapons -> 3 choices
    const fourSave = {
      ...twoSave,
      ownedWeapons: {
        ...twoSave.ownedWeapons,
        shuriken_kaze: {
          weaponId: "shuriken_kaze" as const,
          refineLevel: 0,
          obtainedAt: nowIso,
        },
        mirror_yata: {
          weaponId: "mirror_yata" as const,
          refineLevel: 0,
          obtainedAt: nowIso,
        },
      },
    };
    const fourLaunch = prepareBattleSession(fourSave, "stage_1_bamboo");
    expect(fourLaunch.ok).toBe(true);
    if (!fourLaunch.ok) return;
    const engine4 = createBattleEngine({ launchContext: fourLaunch.data });
    expect(engine4.getViewState().hud.phase).toBe("selecting_initial_weapon");
    expect(engine4.getViewState().hud.pendingUpgradeChoices).toHaveLength(3);
  });
});
