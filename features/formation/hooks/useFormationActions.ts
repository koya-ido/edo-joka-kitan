import { usePlayerSession } from "@/app/session";
import { useAppToast } from "@/components/shared/AppToastProvider";
import { CHARACTER_MASTER_MAP } from "@/data";
import { updateFormation } from "@/storage";
import type { CharacterId, PlayerSaveData } from "@/types";
import { useCallback, useState } from "react";

export interface FormationActionsState {
  readonly isMutating: boolean;
  readonly selectCharacter: (
    save: PlayerSaveData,
    characterId: CharacterId,
  ) => Promise<void>;
}

export const useFormationActions = (): FormationActionsState => {
  const { isPending, applyCommittedSave } = usePlayerSession();
  const { showErrorToast, showSuccessToast } = useAppToast();
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

  return {
    isMutating,
    selectCharacter,
  };
};
