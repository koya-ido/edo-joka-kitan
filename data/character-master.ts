import type { CharacterId, CharacterMaster } from "@/types";

export const CHARACTER_MASTERS: readonly CharacterMaster[] = Object.freeze([
  {
    id: "apprentice_onmyoji",
    name: "安倍 晴明（見習い）",
    title: "見習い陰陽師",
    description:
      "結界術の基礎を修めた若き陰陽師。守護結界の耐久を徐々に回復する。",
    baseHp: 120,
    baseAtk: 20,
    baseLuk: 5,
    hpPerAwakening: 20,
    atkPerAwakening: 4,
    lukPerAwakening: 1,
    maxAwakeningLevel: 5,
    duplicateRewardMagatama: 50,
    passiveSkill: {
      id: "passive_barrier_regen",
      name: "鎮魂の結界",
      description: "毎秒、守護結界の耐久力を一定量回復する。",
      effectType: "barrier_regen",
      baseValue: 1.5,
      valuePerAwakening: 0.5,
    },
    isInitial: true,
  },
  {
    id: "white_fox_miko",
    name: "白狐の巫女・稲荷",
    title: "稲荷の巫女",
    description: "霊狐の加護により会心率と霊力珠の獲得量を高める巫女。",
    baseHp: 100,
    baseAtk: 22,
    baseLuk: 12,
    hpPerAwakening: 15,
    atkPerAwakening: 5,
    lukPerAwakening: 2,
    maxAwakeningLevel: 5,
    duplicateRewardMagatama: 80,
    passiveSkill: {
      id: "passive_luk_and_drop",
      name: "狐火の福徳",
      description: "会心発生率と妖怪撃破時の霊力獲得量を上昇させる。",
      effectType: "luk_and_drop_boost",
      baseValue: 10,
      valuePerAwakening: 3,
    },
    isInitial: false,
  },
  {
    id: "shadow_shinobi",
    name: "朧月・影忍",
    title: "月影の忍",
    description: "神速の印を結び、すべての装備武器の攻撃間隔を短縮する忍。",
    baseHp: 95,
    baseAtk: 25,
    baseLuk: 8,
    hpPerAwakening: 15,
    atkPerAwakening: 6,
    lukPerAwakening: 1.5,
    maxAwakeningLevel: 5,
    duplicateRewardMagatama: 80,
    passiveSkill: {
      id: "passive_attack_speed",
      name: "疾風迅雷の印",
      description:
        "すべての術・武器の攻撃頻度（クールダウン短縮）を上昇させる。",
      effectType: "attack_speed_boost",
      baseValue: 10,
      valuePerAwakening: 3,
    },
    isInitial: false,
  },
]);

export const CHARACTER_MASTER_MAP: Readonly<
  Record<CharacterId, CharacterMaster>
> = Object.freeze(
  Object.fromEntries(
    CHARACTER_MASTERS.map((character) => [character.id, character]),
  ) as Record<CharacterId, CharacterMaster>,
);
