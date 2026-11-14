import { ItemAvatar } from "@/components/shared/ItemAvatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Typography";
import { cn } from "@/components/ui/cn";
import { WEAPON_MASTER_MAP } from "@/data";
import { WEAPON_GENRE_LABELS } from "@/domain";
import type { WeaponId, WeaponMaster } from "@/types";
import { useState } from "react";

export interface WeaponSlotBarProps {
  readonly unlockedWeaponIds: readonly WeaponId[];
  readonly weaponMap?: Readonly<Record<WeaponId, WeaponMaster>>;
  readonly maxSlots?: number;
  readonly compact?: boolean;
  readonly className?: string;
}

export const WeaponSlotBar = ({
  unlockedWeaponIds,
  weaponMap = WEAPON_MASTER_MAP,
  maxSlots = 3,
  compact = false,
  className,
}: WeaponSlotBarProps) => {
  const [selectedWeaponId, setSelectedWeaponId] = useState<WeaponId | null>(null);

  const slots = Array.from({ length: maxSlots }, (_, idx) =>
    idx < unlockedWeaponIds.length ? unlockedWeaponIds[idx] : null,
  );

  const activeSelectedId =
    selectedWeaponId !== null && unlockedWeaponIds.includes(selectedWeaponId)
      ? selectedWeaponId
      : null;
  const selectedWeapon =
    activeSelectedId !== null && Object.hasOwn(weaponMap, activeSelectedId)
      ? weaponMap[activeSelectedId]
      : null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className="grid grid-cols-3 gap-2"
        aria-label="発動中武器スロット"
      >
        {slots.map((weaponId, index) => {
          const weapon =
            weaponId !== null && Object.hasOwn(weaponMap, weaponId)
              ? weaponMap[weaponId]
              : null;

          if (!weapon) {
            return (
              <div
                key={`empty-slot-${String(index)}`}
                className={cn(
                  "flex items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/30 px-2 text-center",
                  compact ? "min-h-12 py-1" : "min-h-16 py-2",
                )}
              >
                <Text size="caption" tone="muted">
                  空き枠 {index + 1}
                </Text>
              </div>
            );
          }

          const isSelected = activeSelectedId === weapon.id;

          return (
            <button
              key={weapon.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${weapon.name}の詳細を表示`}
              onClick={() => {
                setSelectedWeaponId((prev) =>
                  prev === weapon.id ? null : weapon.id,
                );
              }}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1.5 text-center transition-colors touch-manipulation",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "border-primary bg-secondary/80 shadow-xs"
                  : "border-accent/40 bg-card/95 hover:border-primary/60 hover:bg-secondary/40",
                compact ? "min-h-12 py-1" : "min-h-16 py-2",
              )}
            >
              <ItemAvatar name={weapon.name} kind="weapon" size="sm" />
              <Badge
                variant={isSelected ? "accent" : "default"}
                className="whitespace-nowrap text-xs"
              >
                {WEAPON_GENRE_LABELS[weapon.genre]}
              </Badge>
            </button>
          );
        })}
      </div>

      {selectedWeapon ? (
        <Card.Root className="border-primary/35 bg-card/95">
          <Card.Content className="flex flex-col gap-1.5 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <Text size="label" className="font-bold text-card-foreground">
                {selectedWeapon.name}
              </Text>
              <Badge variant="accent" className="shrink-0 whitespace-nowrap">
                {WEAPON_GENRE_LABELS[selectedWeapon.genre]}
              </Badge>
            </div>
            <Text size="caption" tone="muted">
              {selectedWeapon.description}
            </Text>
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <Text size="caption" tabularNums className="font-semibold">
                基本威力 {selectedWeapon.baseDamage}
              </Text>
              <Text size="caption" tabularNums tone="muted">
                攻撃間隔 {selectedWeapon.baseCooldownMs}ms
              </Text>
              {selectedWeapon.baseDurationMs > 0 ? (
                <Text size="caption" tabularNums tone="muted">
                  持続 {selectedWeapon.baseDurationMs}ms
                </Text>
              ) : null}
            </div>
          </Card.Content>
        </Card.Root>
      ) : null}
    </div>
  );
};
