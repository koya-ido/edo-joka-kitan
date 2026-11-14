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
      if (engine.getViewState().hud.phase === "victory") break;
    }

    expect(engine.getViewState().hud.phase).toBe("victory");
    expect(engine.getViewState().hud.currentWave).toBe(10);
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
});
