import type { BattleLaunchContext } from "@/domain";
import type { BattleAudioPort } from "@/engine/audio";
import type {
  BattleHudSnapshot,
  BattlePhase,
  EnemyId,
  InGameBuffState,
  PassiveEffectType,
  StageMaster,
  WeaponColorToken,
  WeaponGenre,
  WeaponId,
  WeaponMaster,
} from "@/types";

export const BATTLE_FIELD_WIDTH = 420 as const;
export const BATTLE_FIELD_HEIGHT = 640 as const;
export const BARRIER_CENTER_X = 210 as const;
export const BARRIER_CENTER_Y = 548 as const;
export const BARRIER_RADIUS = 56 as const;
export const PREPARING_DURATION_MS = 1200 as const;
export const MAX_ACTIVE_WEAPONS = 3 as const;
export const DEFAULT_REROLL_COST_MAGATAMA = 30 as const;

/** 戦闘中の敵（妖怪）インスタンス */
export interface EnemyEntity {
  readonly id: number;
  readonly enemyId: EnemyId;
  readonly name: string;
  x: number;
  y: number;
  hp: number;
  readonly maxHp: number;
  readonly moveSpeed: number;
  readonly contactDamage: number;
  readonly expReward: number;
  readonly isBoss: boolean;
  readonly radius: number;
  contactCooldownMs: number;
  hitFlashMs: number;
  slowRemainingMs?: number;
  slowRatio?: number;
  vulnerableRemainingMs?: number;
  vulnerableMultiplier?: number;
}

/** 飛翔弾・呪符・火縄弾エンティティ */
export interface ProjectileEntity {
  readonly id: number;
  readonly genre: WeaponGenre;
  readonly colorToken: WeaponColorToken;
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly speed: number;
  readonly damage: number;
  readonly isCrit: boolean;
  readonly radius: number;
  remainingLifeMs: number;
  remainingPierce: number;
  readonly explosionRadius: number;
  readonly splashRatio: number;
  readonly homingTurnRate: number;
  remainingBounces: number;
  splitCount: number;
  readonly splitPierceBonus: number;
  readonly splitBounceBonus: number;
  readonly hitEnemyIds: Set<number>;
}

/** 扇状斬撃・突風エフェクト */
export interface SlashArcEntity {
  readonly id: number;
  readonly genre: "sword" | "fan";
  readonly colorToken: WeaponColorToken;
  readonly x: number;
  readonly y: number;
  readonly angleRad: number;
  readonly arcRad: number;
  readonly range: number;
  remainingLifeMs: number;
  readonly maxLifeMs: number;
}

/** 爆発エフェクト */
export interface ExplosionEntity {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  remainingLifeMs: number;
  readonly maxLifeMs: number;
}

/** 鏡系照射ビーム */
export interface BeamEntity {
  readonly id: number;
  readonly colorToken: WeaponColorToken;
  readonly targetEnemyId: number;
  readonly damagePerTick: number;
  readonly isCrit: boolean;
  readonly range: number;
  readonly tickIntervalMs: number;
  tickTimerMs: number;
  remainingLifeMs: number;
  endX: number;
  endY: number;
  readonly bounceRemaining: number;
  readonly explosionRadius: number;
  chainPoints?: readonly { readonly x: number; readonly y: number }[];
}

/** 呪符系・直接召喚（落雷／霊風）エフェクト */
export interface TalismanStrikeEntity {
  readonly id: number;
  readonly colorToken: WeaponColorToken;
  readonly x: number;
  readonly y: number;
  readonly chainLines: readonly {
    readonly fromX: number;
    readonly fromY: number;
    readonly toX: number;
    readonly toY: number;
  }[];
  remainingLifeMs: number;
  readonly maxLifeMs: number;
}

/** 爆発エフェクト */
export interface ExplosionEntity {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  remainingLifeMs: number;
  readonly maxLifeMs: number;
}

/** パーティクルの色トークンキー */
export type ParticleColorKey =
  | "primary"
  | "accent"
  | "hisui"
  | "magatama"
  | "destructive"
  | "foreground"
  | "exp";

/** 汎用パーティクル（浄化粒子・火花・結界飛沫） */
export interface ParticleEntity {
  readonly id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly size: number;
  readonly colorKey: ParticleColorKey;
  readonly gravity: number;
  remainingLifeMs: number;
  readonly maxLifeMs: number;
}

/** 浮遊ダメージ数値 */
export interface FloatingTextEntity {
  readonly id: number;
  x: number;
  y: number;
  readonly text: string;
  readonly isCrit: boolean;
  readonly isHeal: boolean;
  remainingLifeMs: number;
  readonly maxLifeMs: number;
}

/** 解決済み主人公パッシブ効果 */
export interface ResolvedPassiveBonus {
  readonly effectType: PassiveEffectType;
  readonly value: number;
  readonly barrierRegenPerSec: number;
  readonly critRateBonusPct: number;
  readonly expMultiplier: number;
  readonly cooldownMultiplier: number;
}

/** UI・フックへ通知するエンジン統合ビュー状態 */
export interface BattleViewState {
  readonly hud: BattleHudSnapshot;
  readonly buffState: InGameBuffState;
  readonly activeEnemyCount: number;
}

/** エンジンからのイベント通知コールバック */
export interface BattleEngineCallbacks {
  readonly onViewStateChange?: (state: BattleViewState) => void;
  readonly onPhaseChange?: (phase: BattlePhase) => void;
  readonly onFatalError?: (message: string) => void;
}

/** BattleEngine 生成オプション */
export interface BattleEngineConfig {
  readonly launchContext: BattleLaunchContext;
  readonly weaponMap?: Readonly<Record<WeaponId, WeaponMaster>>;
  readonly audio?: BattleAudioPort;
  readonly rng?: () => number;
  readonly callbacks?: BattleEngineCallbacks;
  readonly stageOverride?: StageMaster;
}

/** 武器の genreParams から安全に数値を取得する */
export const readGenreParam = (
  params: Readonly<Record<string, number>>,
  key: string,
  fallback: number,
): number => (Object.hasOwn(params, key) ? params[key] : fallback);
