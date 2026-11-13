import type { StageId, WeaponId } from "./common";

/** バトルフェーズ状態マシン */
export type BattlePhase =
  | "preparing"
  | "playing"
  | "paused"
  | "level_up_modal"
  | "victory"
  | "defeat";

/** ラン内レベルアップ3択カテゴリ */
export type InGameUpgradeCategory =
  | "base_stat"
  | "weapon_stat"
  | "weapon_unlock";

/** ラン内3択の強化対象ステータス種別 */
export type InGameStatType =
  | "atk_pct"
  | "crit_rate"
  | "crit_dmg"
  | "attack_freq"
  | "weapon_dmg"
  | "duration";

/** レベルアップ3択選択肢 */
export interface InGameUpgradeOption {
  readonly id: string;
  readonly category: InGameUpgradeCategory;
  readonly targetWeaponId?: WeaponId;
  readonly statType?: InGameStatType;
  readonly title: string;
  readonly description: string;
  readonly multiplierOrDelta: number;
}

/** 武器別ラン内強化倍率状態 */
export interface WeaponModifierState {
  damageMultiplier: number; // 初期値 1.0
  cooldownMultiplier: number; // 初期値 1.0（小さいほど高速）
  durationMultiplier: number; // 初期値 1.0
}

/** ラン内バフ累積状態（基本ステータスは複利乗算方式） */
export interface InGameBuffState {
  atkMultiplier: number; // 初期値 1.0
  critRateBonusPct: number; // 初期値 0
  critDamageMultiplier: number; // 初期値 1.5
  unlockedWeaponIds: WeaponId[]; // 初期値 [equippedWeaponId]（最大3枠）
  weaponModifiers: Record<WeaponId, WeaponModifierState>;
}

/** Canvas エンジンから React HUD へ通知するスナップショット */
export interface BattleHudSnapshot {
  readonly phase: BattlePhase;
  readonly stageId: StageId;
  readonly currentWave: number;
  readonly totalWaves: number; // 10
  readonly barrierHp: number;
  readonly barrierMaxHp: number;
  readonly level: number;
  readonly exp: number;
  readonly expToNextLevel: number;
  readonly gameSpeed: 1 | 2;
  readonly rerollCostMagatama: number;
  readonly pendingUpgradeChoices: readonly InGameUpgradeOption[];
}

/** バトル終了時の報酬確定ペイロード */
export interface BattleResultPayload {
  readonly stageId: StageId;
  readonly outcome: "victory" | "defeat";
  readonly reachedWave: number;
  readonly earnedMagatama: number;
  readonly earnedHisui: number;
  readonly newlyUnlockedStageId: StageId | null;
}
