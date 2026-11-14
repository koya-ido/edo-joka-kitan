import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { CHARACTER_MASTER_MAP, WEAPON_MASTER_MAP } from "@/data";
import {
  calculateTotalMetaStats,
  getOwnedCharacterEntries,
  getOwnedWeaponEntries,
} from "@/domain";
import { CharacterSelectionList } from "@/features/formation/components/CharacterSelectionList";
import { FormationSummaryCard } from "@/features/formation/components/FormationSummaryCard";
import { WeaponSelectionList } from "@/features/formation/components/WeaponSelectionList";
import type {
  FormationActionsState,
  FormationTab,
} from "@/features/formation/hooks/useFormationActions";
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

  const weaponMaster = Object.hasOwn(WEAPON_MASTER_MAP, save.equippedWeaponId)
    ? WEAPON_MASTER_MAP[save.equippedWeaponId]
    : undefined;

  const ownedCharacters = getOwnedCharacterEntries(save);
  const ownedWeapons = getOwnedWeaponEntries(save);
  const isAnyPending = actions.isMutating || isSessionPending;

  if (!characterMaster || !weaponMaster) {
    return null;
  }

  const awakeningLevel = Object.hasOwn(
    save.ownedCharacters,
    characterMaster.id,
  )
    ? save.ownedCharacters[characterMaster.id].awakeningLevel
    : 0;

  const refineLevel = Object.hasOwn(save.ownedWeapons, weaponMaster.id)
    ? save.ownedWeapons[weaponMaster.id].refineLevel
    : 0;

  const totalStats = calculateTotalMetaStats(save, characterMaster);

  return (
    <div className="flex flex-col gap-4">
      <FormationSummaryCard
        characterMaster={characterMaster}
        awakeningLevel={awakeningLevel}
        weaponMaster={weaponMaster}
        refineLevel={refineLevel}
        totalStats={totalStats}
      />

      <Tabs.Root
        value={actions.activeTab}
        onValueChange={(value) => {
          if (!isAnyPending) {
            actions.setActiveTab(value as FormationTab);
          }
        }}
      >
        <Tabs.List aria-label="編成対象切替">
          <Tabs.Trigger value="character" disabled={isAnyPending}>
            主人公（1名）
          </Tabs.Trigger>
          <Tabs.Trigger value="weapon" disabled={isAnyPending}>
            持ち込み武器（1枠）
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="character">
          <CharacterSelectionList
            entries={ownedCharacters}
            equippedCharacterId={save.equippedCharacterId}
            isMutating={isAnyPending}
            onSelect={(characterId) => {
              void actions.selectCharacter(save, characterId);
            }}
          />
        </Tabs.Content>

        <Tabs.Content value="weapon">
          <WeaponSelectionList
            entries={ownedWeapons}
            equippedWeaponId={save.equippedWeaponId}
            isMutating={isAnyPending}
            onSelect={(weaponId) => {
              void actions.selectWeapon(save, weaponId);
            }}
          />
        </Tabs.Content>
      </Tabs.Root>

      <Button
        type="button"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isAnyPending}
        onClick={() => {
          onNavigate("/stages");
        }}
      >
        <Compass className="h-4 w-4" aria-hidden="true" />
        <span>ステージ選択へ</span>
      </Button>
    </div>
  );
};
