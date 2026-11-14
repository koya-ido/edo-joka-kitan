import { MagatamaIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heading, Text } from "@/components/ui/Typography";
import type { EnhanceStatKey } from "@/data";
import { calculateEnhanceCost } from "@/domain";
import type { EnhanceStatConfig } from "@/types";

export interface EnhanceStatCardProps {
  config: EnhanceStatConfig;
  currentLevel: number;
  magatamaBalance: number;
  enhancingStatKey: EnhanceStatKey | null;
  isAnyPending: boolean;
  onEnhance: (statKey: EnhanceStatKey) => void;
}

export const EnhanceStatCard = ({
  config,
  currentLevel,
  magatamaBalance,
  enhancingStatKey,
  isAnyPending,
  onEnhance,
}: EnhanceStatCardProps) => {
  const isMaxLevel = currentLevel >= config.maxLevel;
  const cost = calculateEnhanceCost(config, currentLevel);
  const hasEnoughMagatama = magatamaBalance >= cost;
  const isThisPending = enhancingStatKey === config.statKey;
  const unit = config.statKey === "lukLevel" ? "%" : "";

  const currentBonus = currentLevel * config.valuePerLevel;
  const nextBonus = (currentLevel + 1) * config.valuePerLevel;

  const badgeVariant = isMaxLevel
    ? "success"
    : currentLevel === 0
      ? "muted"
      : "accent";
  const levelLabel = isMaxLevel
    ? `Lv.${String(currentLevel)}（最大）`
    : currentLevel === 0
      ? "Lv.0"
      : `Lv.${String(currentLevel)} / ${String(config.maxLevel)}`;

  const buttonLabel = isThisPending
    ? "強化中…"
    : isMaxLevel
      ? "最大Lv"
      : !hasEnoughMagatama
        ? "勾玉不足"
        : "強化する";

  const isDisabled = isAnyPending || isMaxLevel || !hasEnoughMagatama;

  return (
    <Card.Root>
      <Card.Content className="flex items-center justify-between gap-3 pt-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Heading as="h3">{config.label}</Heading>
            <Badge variant={badgeVariant}>{levelLabel}</Badge>
          </div>
          {isMaxLevel ? (
            <Text size="caption" tone="success" tabularNums>
              加算値: +{currentBonus}
              {unit}（最大強化到達）
            </Text>
          ) : (
            <Text size="caption" tone="muted" tabularNums>
              加算値: +{currentBonus}
              {unit} →{" "}
              <span className="font-semibold text-foreground">
                +{nextBonus}
                {unit}
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

        <Button
          variant="primary"
          size="md"
          isPending={isThisPending}
          disabled={isDisabled}
          onClick={() => {
            onEnhance(config.statKey);
          }}
          className="shrink-0"
        >
          {buttonLabel}
        </Button>
      </Card.Content>
    </Card.Root>
  );
};
