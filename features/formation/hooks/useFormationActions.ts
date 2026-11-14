import { usePlayerSession } from "@/app/session";
import { useAppToast } from "@/components/shared/AppToastProvider";
import { CHARACTER_MASTER_MAP, WEAPON_MASTER_MAP } from "@/data";
import { updateFormation } from "@/storage";
import type { CharacterId, PlayerSaveData, WeaponId } from "@/types";
import { useCallback, useState } from "react";

export type FormationTab = "character" | "weapon";

export interface FormationActionsState {
  readonly activeTab: FormationTab;
  readonly isMutating: boolean;
  readonly setActiveTab: (tab: FormationTab) => void;
  readonly selectCharacter: (
    save: PlayerSaveData,
    characterId: CharacterId,
  ) => Promise<void>;
  readonly selectWeapon: (
    save: PlayerSaveData,
    weaponId: WeaponId,
  ) => Promise<void>;
}

export const useFormationActions = (): FormationActionsState => {
  const { isPending, applyCommittedSave } = usePlayerSession();
  const { showErrorToast, showSuccessToast } = useAppToast();
  const [activeTab, setActiveTab] = useState<FormationTab>("character");
  const [isMutating, setIsMutating] = useState(false);

  const selectCharacter = useCallback(
    async (save: PlayerSaveData, characterId: CharacterId) => {
      if (isMutating || isPending || save.equippedCharacterId === characterId) {
        return;
      }
      setIsMutating(true);
      try {
        const res = await updateFormation({
          characterId,
          weaponId: save.equippedWeaponId,
        });
        if (res.ok) {
          applyCommittedSave(res.data);
          const name = Object.hasOwn(CHARACTER_MASTER_MAP, characterId)
            ? CHARACTER_MASTER_MAP[characterId].name
            : characterId;
          showSuccessToast(`主人公を「${name}」に変更しました`);
        } else {
          showErrorToast(res.error);
        }
      } finally {
        setIsMutating(false);
      }
    },
    [
      isMutating,
      isPending,
      applyCommittedSave,
      showSuccessToast,
      showErrorToast,
    ],
  );

  const selectWeapon = useCallback(
    async (save: PlayerSaveData, weaponId: WeaponId) => {
      if (isMutating || isPending || save.equippedWeaponId === weaponId) {
        return;
      }
      setIsMutating(true);
      try {
        const res = await updateFormation({
          characterId: save.equippedCharacterId,
          weaponId,
        });
        if (res.ok) {
          applyCommittedSave(res.data);
          const name = Object.hasOwn(WEAPON_MASTER_MAP, weaponId)
            ? WEAPON_MASTER_MAP[weaponId].name
            : weaponId;
          showSuccessToast(`持ち込み武器を「${name}」に変更しました`);
        } else {
          showErrorToast(res.error);
        }
      } finally {
        setIsMutating(false);
      }
    },
    [
      isMutating,
      isPending,
      applyCommittedSave,
      showSuccessToast,
      showErrorToast,
    ],
  );

  return {
    activeTab,
    isMutating,
    setActiveTab,
    selectCharacter,
    selectWeapon,
  };
};
