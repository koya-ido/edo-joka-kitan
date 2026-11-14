import {
  applyUpgradeOption,
  createDefaultWeaponModifier,
  generateUpgradeChoices,
} from "@/domain";
import type { MutableBattleState } from "@/engine/battle-state";
import type { BattlePalette } from "@/engine/palette";
import { renderBattleFrame } from "@/engine/renderer";
import { MAX_ACTIVE_WEAPONS } from "@/engine/types";
import type { InGameUpgradeOption, WeaponId, WeaponMaster } from "@/types";

export const renderEngineFrame = (
  canvasCtx: CanvasRenderingContext2D | null,
  state: MutableBattleState,
  weaponMap: Readonly<Record<WeaponId, WeaponMaster>>,
  palette: BattlePalette,
): void => {
  if (!canvasCtx) return;
  const orbitalWeapons = state.buffState.unlockedWeaponIds
    .filter(
      (id) => Object.hasOwn(weaponMap, id) && weaponMap[id].genre === "orb",
    )
    .map((id) => {
      const mod = Object.hasOwn(state.buffState.weaponModifiers, id)
        ? state.buffState.weaponModifiers[id]
        : undefined;
      return {
        weapon: weaponMap[id],
        angleRad: state.orbAngles.get(id) ?? 0,
        extraOrbs: mod?.extraProjectiles ?? 0,
        rangeMultiplier: mod?.rangeMultiplier ?? 1,
      };
    });
  renderBattleFrame(canvasCtx, {
    palette,
    barrierHp: state.barrierHp,
    barrierMaxHp: state.barrierMaxHp,
    enemies: state.enemies,
    projectiles: state.projectiles,
    slashArcs: state.slashArcs,
    beams: state.beams,
    talismanStrikes: state.talismanStrikes,
    explosions: state.explosions,
    floatingTexts: state.floatingTexts,
    orbitalWeapons,
  });
};

export const buildEngineUpgradeChoices = (
  state: MutableBattleState,
  weaponMap: Readonly<Record<WeaponId, WeaponMaster>>,
  ownedWeaponIds: readonly WeaponId[],
  rng: () => number,
): readonly InGameUpgradeOption[] =>
  generateUpgradeChoices({
    buffState: state.buffState,
    weaponMap,
    allWeapons: Object.values(weaponMap),
    ownedWeaponIds,
    maxActiveWeapons: MAX_ACTIVE_WEAPONS,
    rng,
  });

export const unlockEngineWeaponInRun = (
  state: MutableBattleState,
  weaponId: WeaponId,
  weaponMap: Readonly<Record<WeaponId, WeaponMaster>>,
): boolean => {
  if (state.buffState.unlockedWeaponIds.length >= MAX_ACTIVE_WEAPONS)
    return false;
  if (
    state.buffState.unlockedWeaponIds.includes(weaponId) ||
    !Object.hasOwn(weaponMap, weaponId)
  )
    return false;
  state.buffState.unlockedWeaponIds.push(weaponId);
  state.buffState.weaponModifiers[weaponId] = createDefaultWeaponModifier();
  state.weaponCooldowns.set(weaponId, 0);
  return true;
};

export const applyEngineUpgradeChoice = (
  state: MutableBattleState,
  optionId: string,
  weaponMap: Readonly<Record<WeaponId, WeaponMaster>>,
  ownedWeaponIds: readonly WeaponId[],
  rng: () => number,
): "invalid" | "next_level_up" | "resume_playing" => {
  if (state.phase !== "level_up_modal") return "invalid";
  const option = state.pendingUpgradeChoices.find((c) => c.id === optionId);
  if (!option) return "invalid";
  const applied = applyUpgradeOption(
    state.buffState,
    option,
    weaponMap,
    MAX_ACTIVE_WEAPONS,
  );
  if (!applied.ok) return "invalid";
  state.buffState = applied.data;
  if (option.category === "weapon_unlock" && option.targetWeaponId) {
    state.weaponCooldowns.set(option.targetWeaponId, 0);
  }
  state.pendingLevelUps = Math.max(0, state.pendingLevelUps - 1);
  if (state.pendingLevelUps > 0) {
    state.pendingUpgradeChoices = buildEngineUpgradeChoices(
      state,
      weaponMap,
      ownedWeaponIds,
      rng,
    );
    return "next_level_up";
  }
  state.pendingUpgradeChoices = [];
  return "resume_playing";
};
