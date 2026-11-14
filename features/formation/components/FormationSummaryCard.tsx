import { ItemAvatar } from "@/components/shared/ItemAvatar";
import { StatSummaryGrid } from "@/components/shared/StatSummaryGrid";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Popover } from "@/components/ui/Popover";
import { Separator } from "@/components/ui/Separator";
import { Heading, Text } from "@/components/ui/Typography";
import { getPassiveEffectValue, type TotalMetaStats } from "@/domain";
import type { CharacterMaster } from "@/types";
import { Info } from "lucide-react";

export interface FormationSummaryCardProps {
  characterMaster: CharacterMaster;
  awakeningLevel: number;
  totalStats: TotalMetaStats;
}

export const FormationSummaryCard = ({
  characterMaster,
  awakeningLevel,
  totalStats,
}: FormationSummaryCardProps) => {
  const passiveValue = getPassiveEffectValue(characterMaster, awakeningLevel);

  return (
    <div className="flex flex-col gap-3">
      <Card.Root>
        <Card.Header className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <Heading as="h2">現在の出撃編成</Heading>
            <Badge variant="accent">主人公1名</Badge>
          </div>
        </Card.Header>
        <Separator />
        <Card.Content className="flex flex-col gap-3 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <ItemAvatar
                kind="character"
                name={characterMaster.name}
                badgeLabel={`覚醒 Lv.${String(awakeningLevel)}`}
                size="md"
              />
              <div className="min-w-0">
                <Text size="caption" tone="muted">
                  主人公
                </Text>
                <Text size="label" className="truncate text-foreground">
                  {characterMaster.name}
                </Text>
                <Text size="caption" tone="muted">
                  固有: {characterMaster.passiveSkill.name}
                </Text>
              </div>
            </div>

            <Popover.Root>
              <Popover.Trigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="パッシブ詳細"
                  className="shrink-0"
                >
                  <Info className="h-4 w-4" aria-hidden="true" />
                  <span>パッシブ詳細</span>
                </Button>
              </Popover.Trigger>
              <Popover.Content align="end">
                <div className="flex flex-col gap-1">
                  <Text size="label">{characterMaster.passiveSkill.name}</Text>
                  <Text size="caption" tone="muted">
                    {characterMaster.passiveSkill.description}
                  </Text>
                  <Text size="caption" className="font-semibold text-primary">
                    現在効果値: +{String(passiveValue)}（覚醒 Lv.{String(awakeningLevel)}）
                  </Text>
                </div>
              </Popover.Content>
            </Popover.Root>
          </div>
        </Card.Content>
      </Card.Root>

      <StatSummaryGrid
        title="合成出撃ステータス"
        hp={totalStats.hp}
        atk={totalStats.atk}
        luk={totalStats.luk}
      />
    </div>
  );
};
