import { ItemAvatar } from "@/components/shared/ItemAvatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Typography";
import { cn } from "@/components/ui/cn";
import { WEAPON_MASTER_MAP } from "@/data";
import { WEAPON_GENRE_LABELS } from "@/domain";
import type { WeaponId, WeaponMaster } from "@/types";

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
  const slots = Array.from({ length: maxSlots }, (_, idx) =>
    idx < unlockedWeaponIds.length ? unlockedWeaponIds[idx] : null,
  );

  return (
    <div
      className={cn("grid grid-cols-3 gap-2", className)}
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
                compact ? "min-h-12 py-1" : "min-h-14 py-2",
              )}
            >
              <Text size="caption" tone="muted">
                空き枠 {index + 1}
              </Text>
            </div>
          );
        }

        return (
          <Card.Root
            key={weapon.id}
            className={cn(
              "flex items-center gap-2 border-accent/40 bg-card/95 px-2",
              compact ? "min-h-12 py-1" : "min-h-14 py-2",
            )}
          >
            <ItemAvatar name={weapon.name} kind="weapon" size="sm" />
            <div className="min-w-0 flex-1">
              <Text
                size="caption"
                className="block truncate font-semibold text-card-foreground"
              >
                {weapon.name}
              </Text>
              <Badge variant="default" className="mt-1 text-xs">
                {WEAPON_GENRE_LABELS[weapon.genre]}
              </Badge>
            </div>
          </Card.Root>
        );
      })}
    </div>
  );
};
