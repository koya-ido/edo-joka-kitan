import type { StageId, WeaponId } from "./common";

/** バトルフェーズ状態マシン */
export type BattlePhase =
  | "selecting_initial_weapon"
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
  | "duration"
  | "weapon_range"
  | "sword_slash_unlock"
  | "sword_slash_size"
  | "sword_slash_pierce_1"
  | "sword_slash_pierce_2"
  | "sword_combo_1"
  | "sword_combo_2"
  | "projectile_plus_1"
  | "projectile_plus_2"
  | "pierce_plus_1"
  | "pierce_plus_2"
  | "bounce_plus_1"
  | "bounce_plus_2"
  | "explosion_unlock"
  | "explosion_radius_30"
  | "explosion_radius_50"
  | "explosion_radius_100"
  | "split_unlock"
  | "split_pierce_plus_1"
  | "split_pierce_plus_2"
  | "split_bounce_plus_1"
  | "talisman_chain_plus_1"
  | "talisman_chain_plus_2"
  | "fan_knockback_pct"
  | "debuff_unlock";

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
  rangeMultiplier: number; // 初期値 1.0
  slashWaveEnabled: boolean; // 初期値 false（刀剣類の斬撃発生）
  slashWaveSizeMultiplier: number; // 初期値 1.0
  slashWavePierceBonus: number; // 初期値 0
  comboBonus: number; // 初期値 0（刀剣類の連撃追加数）
  extraProjectiles: number; // 初期値 0（射出数/旋回珠数追加）
  pierceBonus: number; // 初期値 0（貫通数追加）
  bounceBonus: number; // 初期値 0（反射回数追加）
  explosionEnabled: boolean; // 初期値 false（爆発発生）
  explosionRadiusMultiplier: number; // 初期値 1.0（爆発範囲倍率）
  splitEnabled: boolean; // 初期値 false（分裂発生+2）
  splitPierceBonus: number; // 初期値 0（分裂弾貫通追加）
  splitBounceBonus: number; // 初期値 0（分裂弾反射追加）
  chainBonus: number; // 初期値 0（呪符の連鎖数追加）
  knockbackMultiplier: number; // 初期値 1.0（扇のノックバック距離倍率）
  debuffLevel: number; // 初期値 0（デバフ付与レベル）
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
