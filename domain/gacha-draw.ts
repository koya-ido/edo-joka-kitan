import { CHARACTER_MASTERS, WEAPON_MASTERS } from "@/data";
import type { GachaPullResultItem } from "@/domain/gacha-types";
import type {
  CharacterId,
  GachaPoolType,
  OwnedCharacterState,
  OwnedWeaponState,
  WeaponId,
} from "@/types";

const pickPoolIndex = (poolLength: number, rng: () => number): number => {
  const raw = rng();
  const normalized = Number.isFinite(raw) ? raw : 0;
  return Math.min(
    poolLength - 1,
    Math.max(0, Math.floor(normalized * poolLength)),
  );
};

interface DrawSpec<TId extends string, TState> {
  readonly poolType: GachaPoolType;
  readonly ownedMap: Record<TId, TState>;
  readonly targetId: TId;
  readonly name: string;
  readonly maxLevel: number;
  readonly duplicateRewardMagatama: number;
  readonly getLevel: (state: TState) => number;
  readonly createInitial: () => TState;
  readonly withLevel: (state: TState, nextLevel: number) => TState;
}

const applySingleDraw = <TId extends string, TState>(
  spec: DrawSpec<TId, TState>,
): GachaPullResultItem => {
  const { ownedMap, targetId } = spec;
  const existing = Object.hasOwn(ownedMap, targetId)
    ? ownedMap[targetId]
    : undefined;

  if (!existing) {
    ownedMap[targetId] = spec.createInitial();
    return {
      poolType: spec.poolType,
      targetId,
      name: spec.name,
      outcome: "new",
      previousLevel: null,
      nextLevel: 0,
      convertedMagatama: 0,
    };
  }

  const currentLevel = spec.getLevel(existing);
  if (currentLevel < spec.maxLevel) {
    const nextLevel = currentLevel + 1;
    ownedMap[targetId] = spec.withLevel(existing, nextLevel);
    return {
      poolType: spec.poolType,
      targetId,
      name: spec.name,
      outcome: "awakening_or_refine",
      previousLevel: currentLevel,
      nextLevel,
      convertedMagatama: 0,
    };
  }

  return {
    poolType: spec.poolType,
    targetId,
    name: spec.name,
    outcome: "converted_to_magatama",
    previousLevel: currentLevel,
    nextLevel: currentLevel,
    convertedMagatama: spec.duplicateRewardMagatama,
  };
};

/** プールから1件抽選し、新規獲得・重複覚醒精錬・上限勾玉変換を適用する */
export const drawFromPool = (
  poolType: GachaPoolType,
  nextCharacters: Record<CharacterId, OwnedCharacterState>,
  nextWeapons: Record<WeaponId, OwnedWeaponState>,
  rng: () => number,
  nowIso: string,
): GachaPullResultItem => {
  if (poolType === "character") {
    const target =
      CHARACTER_MASTERS[pickPoolIndex(CHARACTER_MASTERS.length, rng)];
    return applySingleDraw({
      poolType,
      ownedMap: nextCharacters,
      targetId: target.id,
      name: target.name,
      maxLevel: target.maxAwakeningLevel,
      duplicateRewardMagatama: target.duplicateRewardMagatama,
      getLevel: (s) => s.awakeningLevel,
      createInitial: () => ({
        characterId: target.id,
        awakeningLevel: 0,
        obtainedAt: nowIso,
      }),
      withLevel: (s, nextLevel) => ({ ...s, awakeningLevel: nextLevel }),
    });
  }

  const target = WEAPON_MASTERS[pickPoolIndex(WEAPON_MASTERS.length, rng)];
  return applySingleDraw({
    poolType,
    ownedMap: nextWeapons,
    targetId: target.id,
    name: target.name,
    maxLevel: target.maxRefineLevel,
    duplicateRewardMagatama: target.duplicateRewardMagatama,
    getLevel: (s) => s.refineLevel,
    createInitial: () => ({
      weaponId: target.id,
      refineLevel: 0,
      obtainedAt: nowIso,
    }),
    withLevel: (s, nextLevel) => ({ ...s, refineLevel: nextLevel }),
  });
};
