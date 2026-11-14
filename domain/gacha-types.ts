import type {
  CharacterId,
  GachaOutcomeType,
  GachaPoolType,
  PlayerSaveData,
  WeaponId,
} from "@/types";

export type GachaPullCount = 1 | 10;

export interface GachaPullResultItem {
  readonly poolType: GachaPoolType;
  readonly targetId: CharacterId | WeaponId;
  readonly name: string;
  readonly outcome: GachaOutcomeType;
  readonly previousLevel: number | null;
  readonly nextLevel: number;
  readonly convertedMagatama: number;
}

export interface GachaExecutionOutput {
  readonly nextSave: PlayerSaveData;
  readonly items: readonly GachaPullResultItem[];
  readonly spentHisui: number;
  readonly totalConvertedMagatama: number;
}

export interface GachaDropRateEntry {
  readonly id: CharacterId | WeaponId;
  readonly name: string;
  readonly ratePercent: number;
}
