/**
 * 共通識別子・列挙型・ドメインエラー型（正本 / Single Source of Truth）
 */

/** 通貨種別（水晶の勾玉 / 翡翠） */
export type CurrencyType = "magatama" | "hisui";

/** 武器ジャンル（8系統） */
export type WeaponGenre =
  | "bow" // 弓矢系: 長射程・直線貫通
  | "sword" // 刀剣系: 中射程・扇状薙ぎ払い
  | "shuriken" // 手裏剣系: 高連射・多重拡散
  | "mirror" // 鏡系: 持続照射・光線反射
  | "talisman" // 呪符系: 召喚・連鎖・状態異常
  | "matchlock" // 火縄銃系: 超高火力・貫通
  | "fan" // 扇・軍配系: 突風・ノックバック
  | "orb"; // 霊珠・勾玉系: 旋回オービット・接触削り

/** キャラクター固有パッシブ効果種別 */
export type PassiveEffectType =
  | "barrier_regen"
  | "luk_and_drop_boost"
  | "attack_speed_boost";

/** キャラクターID */
export type CharacterId =
  | "apprentice_onmyoji"
  | "white_fox_miko"
  | "shadow_shinobi"
  | (string & {});

/** 武器ID */
export type WeaponId = "sword_hamon" | (string & {});

/** ステージID */
export type StageId =
  | "stage_1_bamboo"
  | "stage_2_old_road"
  | "stage_3_shrine"
  | (string & {});

/** 敵（妖怪）ID */
export type EnemyId = string;

/** ガチャ排出プール種別 */
export type GachaPoolType = "character" | "weapon";

/** ガチャ排出結果ステータス */
export type GachaOutcomeType =
  | "new"
  | "awakening_or_refine"
  | "converted_to_magatama";

/** ドメインガード・ストレージ検証エラーコード */
export type DomainErrorCode =
  | "INSUFFICIENT_MAGATAMA"
  | "INSUFFICIENT_HISUI"
  | "ALREADY_MAX_LEVEL"
  | "LOGIN_BONUS_ALREADY_CLAIMED"
  | "UNOWNED_CHARACTER"
  | "UNOWNED_WEAPON"
  | "EMPTY_WEAPON_SELECTION"
  | "STAGE_LOCKED"
  | "INVALID_STAGE_ID"
  | "SAVE_CORRUPTED"
  | "STORAGE_ERROR";

/** ドメインエラー構造 */
export interface DomainError {
  readonly code: DomainErrorCode;
  readonly message: string;
}

/** 構造化Result型 */
export type DomainResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: DomainError };
