import type { StageId, StageMaster, StageWaveDefinition } from "@/types";

const buildDefaultWaves = (
  baseCount: number,
  bossEnemyId: string,
): readonly StageWaveDefinition[] =>
  Object.freeze(
    Array.from({ length: 10 }, (_, index) => {
      const waveNumber = index + 1;
      const isFinalWave = waveNumber === 10;
      return {
        waveNumber,
        spawns: isFinalWave
          ? [
              {
                enemyId: "oni_imp",
                count: baseCount + waveNumber,
                spawnIntervalMs: 700,
              },
              {
                enemyId: bossEnemyId,
                count: 1,
                spawnIntervalMs: 1000,
                isBoss: true,
              },
            ]
          : [
              {
                enemyId: waveNumber % 2 === 0 ? "kappa_stray" : "oni_imp",
                count: baseCount + waveNumber * 2,
                spawnIntervalMs: 850,
              },
            ],
      };
    }),
  );

export const STAGE_MASTERS: readonly StageMaster[] = Object.freeze([
  {
    id: "stage_1_bamboo",
    order: 1,
    name: "第壱節：迷いの竹林",
    description:
      "江戸郊外の霧深き竹林。小鬼の群れを祓い、最初の結界を守り抜け。",
    corruptionLevel: 100,
    unlockRequirementStageId: null,
    waves: buildDefaultWaves(4, "boss_nue"),
    clearReward: { magatama: 120, hisui: 2 },
    firstClearBonusHisui: 5,
  },
  {
    id: "stage_2_old_road",
    order: 2,
    name: "第弐節：枯れ宿場の古道",
    description: "妖気が濃さを増す廃宿場。素早い妖怪の波状攻撃に備えよ。",
    corruptionLevel: 250,
    unlockRequirementStageId: "stage_1_bamboo",
    waves: buildDefaultWaves(6, "boss_nue"),
    clearReward: { magatama: 200, hisui: 3 },
    firstClearBonusHisui: 5,
  },
  {
    id: "stage_3_shrine",
    order: 3,
    name: "第参節：穢れし古社",
    description: "大妖が巣食う鎮守の社。すべての霊力を結集し、穢土を浄化せよ。",
    corruptionLevel: 450,
    unlockRequirementStageId: "stage_2_old_road",
    waves: buildDefaultWaves(8, "boss_nue"),
    clearReward: { magatama: 320, hisui: 5 },
    firstClearBonusHisui: 10,
  },
]);

export const STAGE_MASTER_MAP: Readonly<Record<StageId, StageMaster>> =
  Object.freeze(
    Object.fromEntries(
      STAGE_MASTERS.map((stage) => [stage.id, stage]),
    ) as Record<StageId, StageMaster>,
  );
