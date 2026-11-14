import type { DBSchema } from "idb";
import type { CharacterId, StageId, WeaponId } from "./common";

/** IndexedDB データベース定数 */
export const DB_NAME = "edo-purification-db" as const;
export const DB_VERSION = 1 as const;
export const SAVE_SCHEMA_VERSION = 1 as const;
export const SAVE_RECORD_KEY = "primary" as const;

/** 所持通貨残高 */
export interface CurrencyBalances {
  magatama: number; // 水晶の勾玉（>= 0）
  hisui: number; // 翡翠（>= 0）
}

/** 永続基礎ステータス強化レベル（加算方式） */
export interface PermanentStatLevels {
  hpLevel: number; // 0以上
  atkLevel: number; // 0以上
  lukLevel: number; // 0以上
}

/** 所持キャラクター個別状態 */
export interface OwnedCharacterState {
  characterId: CharacterId;
  awakeningLevel: number; // 0（無凸）〜 maxAwakeningLevel
  obtainedAt: string; // ISO 8601
}

/** 所持武器個別状態 */
export interface OwnedWeaponState {
  weaponId: WeaponId;
  refineLevel: number; // 0（未精錬）〜 maxRefineLevel
  obtainedAt: string; // ISO 8601
}

/** 永続プレイヤーセーブデータ（"primary" レコード） */
export interface PlayerSaveData {
  schemaVersion: number;
  currencies: CurrencyBalances;
  permanentStats: PermanentStatLevels;
  ownedCharacters: Record<CharacterId, OwnedCharacterState>;
  ownedWeapons: Record<WeaponId, OwnedWeaponState>;
  equippedCharacterId: CharacterId;
  unlockedStageIds: StageId[];
  clearedStageIds: StageId[];
  lastLoginBonusDate: string | null; // "YYYY-MM-DD"（ローカル時刻基準）
  updatedAt: string; // ISO 8601
}

/** IndexedDB (`idb`) スキーマ定義 */
export interface EdoPurificationDB extends DBSchema {
  playerSave: {
    key: typeof SAVE_RECORD_KEY;
    value: PlayerSaveData;
  };
}
