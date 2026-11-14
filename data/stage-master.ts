import type { StageId, StageMaster, StageWaveDefinition } from "@/types";

const buildStageWaves = (
  baseCount: number,
  primaryEnemyId: string,
  secondaryEnemyId: string,
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
                enemyId: secondaryEnemyId,
                count: baseCount + waveNumber,
                spawnIntervalMs: 650,
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
                enemyId:
                  waveNumber % 2 === 0 ? secondaryEnemyId : primaryEnemyId,
                count: baseCount + waveNumber * 2,
                spawnIntervalMs: 820,
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
    waves: buildStageWaves(4, "oni_imp", "kappa_stray", "boss_nue"),
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
    waves: buildStageWaves(6, "oni_imp", "kappa_stray", "boss_nue"),
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
    waves: buildStageWaves(8, "oni_imp", "kappa_stray", "boss_nue"),
    clearReward: { magatama: 320, hisui: 5 },
    firstClearBonusHisui: 10,
  },
  {
    id: "stage_4_castle_gate",
    order: 4,
    name: "第肆節：鬼門の城門",
    description: "妖灯が揺らめく鬼門の関。提灯お化けと河童の混成部隊を退けよ。",
    corruptionLevel: 700,
    unlockRequirementStageId: "stage_3_shrine",
    waves: buildStageWaves(8, "kappa_stray", "chochin_obake", "boss_nue"),
    clearReward: { magatama: 450, hisui: 7 },
    firstClearBonusHisui: 10,
  },
  {
    id: "stage_5_burning_bridge",
    order: 5,
    name: "第伍節：火車の朱橋",
    description:
      "業火の車輪が駆ける朱塗りの橋。大妖・酒呑童子の先鋒を迎撃せよ。",
    corruptionLevel: 1000,
    unlockRequirementStageId: "stage_4_castle_gate",
    waves: buildStageWaves(9, "chochin_obake", "kasha_wheel", "boss_shuten"),
    clearReward: { magatama: 600, hisui: 9 },
    firstClearBonusHisui: 15,
  },
  {
    id: "stage_6_bone_valley",
    order: 6,
    name: "第陸節：骸の枯れ谷",
    description: "怨念が骨となりて立ち塞がる荒谷。堅牢な骸骨武者を打ち砕け。",
    corruptionLevel: 1400,
    unlockRequirementStageId: "stage_5_burning_bridge",
    waves: buildStageWaves(
      10,
      "kasha_wheel",
      "gashadokuro_mini",
      "boss_shuten",
    ),
    clearReward: { magatama: 780, hisui: 11 },
    firstClearBonusHisui: 15,
  },
  {
    id: "stage_7_crimson_keep",
    order: 7,
    name: "第漆節：紅蓮の天守",
    description: "酒呑童子が居座る妖城の天守閣。激闘を制し紅蓮の妖気を断て。",
    corruptionLevel: 1900,
    unlockRequirementStageId: "stage_6_bone_valley",
    waves: buildStageWaves(
      11,
      "chochin_obake",
      "gashadokuro_mini",
      "boss_shuten",
    ),
    clearReward: { magatama: 980, hisui: 14 },
    firstClearBonusHisui: 20,
  },
  {
    id: "stage_8_fox_forest",
    order: 8,
    name: "第捌節：妖狐の幽林",
    description: "九尾の幻術が渦巻く幽玄の森。疾駆する火車輪の群れを凌ぎ切れ。",
    corruptionLevel: 2500,
    unlockRequirementStageId: "stage_7_crimson_keep",
    waves: buildStageWaves(
      12,
      "kasha_wheel",
      "gashadokuro_mini",
      "boss_tamamo",
    ),
    clearReward: { magatama: 1200, hisui: 17 },
    firstClearBonusHisui: 20,
  },
  {
    id: "stage_9_torii_abyss",
    order: 9,
    name: "第玖節：千本鳥居の深淵",
    description:
      "果てなき朱鳥居の奥に潜む深淵。絶え間なき妖魔の猛攻を祓い抜け。",
    corruptionLevel: 3200,
    unlockRequirementStageId: "stage_8_fox_forest",
    waves: buildStageWaves(
      13,
      "chochin_obake",
      "gashadokuro_mini",
      "boss_tamamo",
    ),
    clearReward: { magatama: 1450, hisui: 20 },
    firstClearBonusHisui: 25,
  },
  {
    id: "stage_10_edo_core",
    order: 10,
    name: "第拾節：常闇の江戸城本丸",
    description:
      "すべての穢土の根源。九尾・玉藻前を討ち、江戸の夜明けを取り戻せ。",
    corruptionLevel: 4000,
    unlockRequirementStageId: "stage_9_torii_abyss",
    waves: buildStageWaves(
      14,
      "kasha_wheel",
      "gashadokuro_mini",
      "boss_tamamo",
    ),
    clearReward: { magatama: 1800, hisui: 25 },
    firstClearBonusHisui: 30,
  },
]);

export const STAGE_MASTER_MAP: Readonly<Record<StageId, StageMaster>> =
  Object.freeze(
    Object.fromEntries(
      STAGE_MASTERS.map((stage) => [stage.id, stage]),
    ) as Record<StageId, StageMaster>,
  );
