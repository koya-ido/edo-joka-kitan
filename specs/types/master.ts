import type {
  CharacterId,
  EnemyId,
  PassiveEffectType,
  StageId,
  WeaponGenre,
  WeaponId,
} from "./common";

/** キャラクター固有パッシブスキル定義 */
export interface PassiveSkillDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly effectType: PassiveEffectType;
  readonly baseValue: number;
  readonly valuePerAwakening: number;
}

/** キャラクターマスタ定義（不変） */
export interface CharacterMaster {
  readonly id: CharacterId;
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly baseHp: number;
  readonly baseAtk: number;
  readonly baseLuk: number; // 会心率ベース（%）
  readonly hpPerAwakening: number;
  readonly atkPerAwakening: number;
  readonly lukPerAwakening: number;
  readonly maxAwakeningLevel: number;
  readonly duplicateRewardMagatama: number;
  readonly passiveSkill: PassiveSkillDefinition;
  readonly isInitial: boolean;
}

/** 武器マスタ定義（不変） */
export interface WeaponMaster {
  readonly id: WeaponId;
  readonly name: string;
  readonly genre: WeaponGenre;
  readonly description: string;
  readonly baseDamage: number;
  readonly damagePerRefine: number;
  readonly baseCooldownMs: number;
  readonly baseDurationMs: number;
  readonly projectileSpeed: number;
  readonly genreParams: Readonly<Record<string, number>>;
  readonly maxRefineLevel: number;
  readonly duplicateRewardMagatama: number;
  readonly isInitial: boolean;
}

/** 敵（妖怪）マスタ定義（不変） */
export interface EnemyMaster {
  readonly id: EnemyId;
  readonly name: string;
  readonly maxHp: number;
  readonly moveSpeed: number;
  readonly contactDamage: number;
  readonly expReward: number;
  readonly isBoss: boolean;
  readonly radius: number;
}

/** ウェーブ内敵出現定義 */
export interface WaveSpawnEntry {
  readonly enemyId: EnemyId;
  readonly count: number;
  readonly spawnIntervalMs: number;
  readonly isBoss?: boolean;
}

/** ステージウェーブ定義 */
export interface StageWaveDefinition {
  readonly waveNumber: number; // 1 〜 10
  readonly spawns: readonly WaveSpawnEntry[];
}

/** ステージマスタ定義（不変） */
export interface StageMaster {
  readonly id: StageId;
  readonly order: number;
  readonly name: string;
  readonly description: string;
  readonly corruptionLevel: number;
  readonly unlockRequirementStageId: StageId | null;
  readonly waves: readonly StageWaveDefinition[]; // 全10ウェーブ
  readonly clearReward: {
    readonly magatama: number;
    readonly hisui: number;
  };
  readonly firstClearBonusHisui: number;
}

/** 永続強化パラメータ定義 */
export interface EnhanceStatConfig {
  readonly statKey: "hpLevel" | "atkLevel" | "lukLevel";
  readonly label: string;
  readonly valuePerLevel: number;
  readonly baseCostMagatama: number;
  readonly costStepMagatama: number;
  readonly maxLevel: number;
}

/** ガチャ定数・提供設定 */
export interface GachaConfig {
  readonly singleCostHisui: number; // 5
  readonly multiPullCount: number; // 10
  readonly multiCostHisui: number; // 50
}

/** ログインボーナス報酬設定 */
export interface LoginBonusConfig {
  readonly magatama: number;
  readonly hisui: number;
}
