import { ItemAvatar } from "@/components/shared/ItemAvatar";
import { SelectableCard } from "@/components/shared/SelectableCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Text } from "@/components/ui/Typography";
import { getPassiveEffectValue, type OwnedCharacterEntry } from "@/domain";
import type { CharacterId } from "@/types";

export interface CharacterSelectionListProps {
  entries: readonly OwnedCharacterEntry[];
  equippedCharacterId: CharacterId;
  isMutating: boolean;
  onSelect: (characterId: CharacterId) => void;
}

export const CharacterSelectionList = ({
  entries,
  equippedCharacterId,
  isMutating,
  onSelect,
}: CharacterSelectionListProps) => (
  <div className="flex flex-col gap-3">
    <ScrollArea.Root className="max-h-72 pr-2">
      <RadioGroup.Root
        aria-label="主人公選択"
        value={equippedCharacterId}
        disabled={isMutating}
        onValueChange={(value) => {
          onSelect(value);
        }}
      >
        {entries.map((entry) => {
          const passiveVal = getPassiveEffectValue(
            entry.master,
            entry.state.awakeningLevel,
          );
          return (
            <SelectableCard
              key={entry.master.id}
              value={entry.master.id}
              title={entry.master.name}
              subtitle={`${entry.master.title} / 覚醒 Lv.${String(entry.state.awakeningLevel)}`}
              description={entry.master.description}
              disabled={entry.isEquipped || isMutating}
              leading={
                <ItemAvatar
                  kind="character"
                  name={entry.master.name}
                  size="sm"
                />
              }
              badge={
                entry.isEquipped ? (
                  <StatusBadge status="equipped" />
                ) : (
                  <Badge variant="muted">切替可能</Badge>
                )
              }
              meta={
                <>
                  <Badge variant="default">
                    {entry.master.passiveSkill.name} (+{String(passiveVal)})
                  </Badge>
                  <Text size="caption" tone="muted" tabularNums>
                    基礎 耐久 {String(entry.master.baseHp)} / 攻撃{" "}
                    {String(entry.master.baseAtk)} / 会心{" "}
                    {String(entry.master.baseLuk)}%
                  </Text>
                </>
              }
            />
          );
        })}
      </RadioGroup.Root>
    </ScrollArea.Root>

    {entries.length <= 1 && (
      <Text size="caption" tone="muted" className="px-1">
        現在所持している主人公は1名のみです。他の候補はガチャ（召喚）で獲得できます。
      </Text>
    )}
  </div>
);
