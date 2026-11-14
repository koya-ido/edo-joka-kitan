import { ItemAvatar } from "@/components/shared/ItemAvatar";
import { SelectableCard } from "@/components/shared/SelectableCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Text } from "@/components/ui/Typography";
import {
  WEAPON_GENRE_LABELS,
  getWeaponEffectiveDamage,
  type OwnedWeaponEntry,
} from "@/domain";
import type { WeaponId } from "@/types";

export interface WeaponSelectionListProps {
  entries: readonly OwnedWeaponEntry[];
  equippedWeaponId: WeaponId;
  isMutating: boolean;
  onSelect: (weaponId: WeaponId) => void;
}

export const WeaponSelectionList = ({
  entries,
  equippedWeaponId,
  isMutating,
  onSelect,
}: WeaponSelectionListProps) => (
  <div className="flex flex-col gap-3">
    <RadioGroup.Root
      aria-label="持ち込み武器選択"
      value={equippedWeaponId}
      disabled={isMutating}
      onValueChange={(value) => {
        onSelect(value);
      }}
    >
      {entries.map((entry) => {
        const damage = getWeaponEffectiveDamage(
          entry.master,
          entry.state.refineLevel,
        );
        return (
          <SelectableCard
            key={entry.master.id}
            value={entry.master.id}
            title={entry.master.name}
            subtitle={`${WEAPON_GENRE_LABELS[entry.master.genre]} / 精錬 Lv.${String(entry.state.refineLevel)}`}
            description={entry.master.description}
            disabled={entry.isEquipped || isMutating}
            leading={
              <ItemAvatar kind="weapon" name={entry.master.name} size="sm" />
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
                <Badge variant="accent">威力 {String(damage)}</Badge>
                <Text size="caption" tone="muted" tabularNums>
                  攻撃間隔 {String(entry.master.baseCooldownMs)}ms
                </Text>
              </>
            }
          />
        );
      })}
    </RadioGroup.Root>
  </div>
);
