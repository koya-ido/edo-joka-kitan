import { MagatamaIcon } from "@/components/icons";
import { ItemAvatar } from "@/components/shared/ItemAvatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heading, Text } from "@/components/ui/Typography";
import {
  calculateWeaponRefineCost,
  getWeaponEffectiveDamage,
  type OwnedWeaponEntry,
} from "@/domain";
import type { WeaponId } from "@/types";

export interface EnhanceWeaponCardProps {
  readonly entry: OwnedWeaponEntry;
  readonly isEquipped: boolean;
  readonly magatamaBalance: number;
  readonly refiningWeaponId: WeaponId | null;
  readonly isAnyPending: boolean;
  readonly onRefine: (weaponId: WeaponId) => void;
}

export const EnhanceWeaponCard = ({
  entry,
  isEquipped,
  magatamaBalance,
  refiningWeaponId,
  isAnyPending,
  onRefine,
}: EnhanceWeaponCardProps) => {
  const { master, state } = entry;
  const currentLevel = state.refineLevel;
  const isMaxLevel = currentLevel >= master.maxRefineLevel;
  const cost = calculateWeaponRefineCost(currentLevel);
  const hasEnoughMagatama = magatamaBalance >= cost;
  const isThisPending = refiningWeaponId === master.id;

  const currentDamage = getWeaponEffectiveDamage(master, currentLevel);
  const nextDamage = getWeaponEffectiveDamage(master, currentLevel + 1);

  const badgeVariant = isMaxLevel
    ? "success"
    : currentLevel === 0
      ? "muted"
      : "accent";
  const levelLabel = isMaxLevel
    ? `精錬Lv.${String(currentLevel)}（最大）`
    : currentLevel === 0
      ? "精錬Lv.0"
      : `精錬Lv.${String(currentLevel)} / ${String(master.maxRefineLevel)}`;

  const buttonLabel = isThisPending
    ? "強化中…"
    : isMaxLevel
      ? "最大Lv"
      : !hasEnoughMagatama
        ? "勾玉不足"
        : "精錬する";

  const isDisabled = isAnyPending || isMaxLevel || !hasEnoughMagatama;

  return (
    <Card.Root>
      <Card.Content className="flex items-center justify-between gap-3 pt-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <ItemAvatar
            kind="weapon"
            size="md"
            name={master.name}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Heading as="h3" className="truncate">
                {master.name}
              </Heading>
              <Badge variant={badgeVariant}>{levelLabel}</Badge>
              {isEquipped && <Badge variant="success">装備中</Badge>}
            </div>
            {isMaxLevel ? (
              <Text size="caption" tone="success" tabularNums>
                威力: {currentDamage}（最大精錬到達）
              </Text>
            ) : (
              <Text size="caption" tone="muted" tabularNums>
                威力: {currentDamage} →{" "}
                <span className="font-semibold text-foreground">
                  {nextDamage}
                </span>
              </Text>
            )}
            {!isMaxLevel && (
              <div className="flex items-center gap-1 pt-0.5">
                <Text
                  size="caption"
                  className={hasEnoughMagatama ? undefined : "text-warning"}
                >
                  必要数:
                </Text>
                <MagatamaIcon
                  className={
                    hasEnoughMagatama
                      ? "h-4 w-4 text-magatama"
                      : "h-4 w-4 text-warning"
                  }
                  aria-hidden="true"
                />
                <Text
                  size="caption"
                  tabularNums
                  className={hasEnoughMagatama ? undefined : "text-warning"}
                >
                  ×{cost}
                </Text>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          isPending={isThisPending}
          disabled={isDisabled}
          onClick={() => {
            onRefine(master.id);
          }}
          className="shrink-0"
        >
          {buttonLabel}
        </Button>
      </Card.Content>
    </Card.Root>
  );
};
