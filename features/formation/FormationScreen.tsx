import { Button } from "@/components/ui/Button";
import { CHARACTER_MASTER_MAP } from "@/data";
import { calculateTotalMetaStats, getOwnedCharacterEntries } from "@/domain";
import { CharacterSelectionList } from "@/features/formation/components/CharacterSelectionList";
import { FormationSummaryCard } from "@/features/formation/components/FormationSummaryCard";
import type { FormationActionsState } from "@/features/formation/hooks/useFormationActions";
import type { PlayerSaveData } from "@/types";
import { Compass } from "lucide-react";

export interface FormationScreenProps {
  save: PlayerSaveData;
  actions: FormationActionsState;
  isSessionPending?: boolean;
  onNavigate: (to: string) => void;
}

export const FormationScreen = ({
  save,
  actions,
  isSessionPending = false,
  onNavigate,
}: FormationScreenProps) => {
  const characterMaster = Object.hasOwn(
    CHARACTER_MASTER_MAP,
    save.equippedCharacterId,
  )
    ? CHARACTER_MASTER_MAP[save.equippedCharacterId]
    : undefined;

  const ownedCharacters = getOwnedCharacterEntries(save);
  const isAnyPending = actions.isMutating || isSessionPending;

  if (!characterMaster) {
    return null;
  }

  const awakeningLevel = Object.hasOwn(
    save.ownedCharacters,
    characterMaster.id,
  )
    ? save.ownedCharacters[characterMaster.id].awakeningLevel
    : 0;

  const totalStats = calculateTotalMetaStats(save, characterMaster);

  return (
    <div className="flex flex-col gap-4">
      <FormationSummaryCard
        characterMaster={characterMaster}
        awakeningLevel={awakeningLevel}
        totalStats={totalStats}
      />

      <CharacterSelectionList
        entries={ownedCharacters}
        equippedCharacterId={save.equippedCharacterId}
        isMutating={isAnyPending}
        onSelect={(characterId) => {
          void actions.selectCharacter(save, characterId);
        }}
      />

      <Button
        type="button"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isAnyPending}
        onClick={() => {
          onNavigate("#/stages");
        }}
      >
        <Compass className="h-5 w-5" aria-hidden="true" />
        <span>この編成で出撃準備へ</span>
      </Button>
    </div>
  );
};
