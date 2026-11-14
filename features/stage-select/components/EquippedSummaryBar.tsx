import { ItemAvatar } from "@/components/shared/ItemAvatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heading, Text } from "@/components/ui/Typography";
import type { EquippedFormationSummary } from "@/features/stage-select/hooks/useStageSelect";
import { Settings2 } from "lucide-react";

export interface EquippedSummaryBarProps {
  readonly summary: EquippedFormationSummary;
  readonly isDisabled: boolean;
  readonly onOpenFormation: () => void;
}

export const EquippedSummaryBar = ({
  summary,
  isDisabled,
  onOpenFormation,
}: EquippedSummaryBarProps) => {
  const { characterMaster, awakeningLevel } = summary;

  return (
    <Card.Root>
      <Card.Header>
        <div className="flex items-center justify-between gap-2">
          <Heading as="h2">現在の出撃編成</Heading>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isDisabled}
            className="min-h-11 touch-manipulation"
            onClick={onOpenFormation}
          >
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            <span>編成変更</span>
          </Button>
        </div>
      </Card.Header>

      <Card.Content>
        <div className="flex items-center gap-3 rounded-md border border-border bg-background/60 p-3">
          {characterMaster ? (
            <>
              <ItemAvatar
                kind="character"
                name={characterMaster.name}
                badgeLabel={`覚醒Lv.${String(awakeningLevel)}`}
                size="sm"
              />
              <div className="min-w-0">
                <Text size="caption" tone="muted">
                  主人公
                </Text>
                <Text size="label" className="truncate">
                  {characterMaster.name}
                </Text>
              </div>
            </>
          ) : (
            <Text size="caption" tone="destructive">
              主人公が未設定です
            </Text>
          )}
        </div>
      </Card.Content>
    </Card.Root>
  );
};
