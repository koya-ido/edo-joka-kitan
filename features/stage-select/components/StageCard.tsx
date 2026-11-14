import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Heading, Text } from "@/components/ui/Typography";
import type { StageSelectItem } from "@/domain";
import { Lock, Sparkles, Swords } from "lucide-react";

export interface StageCardProps {
  readonly item: StageSelectItem;
  readonly isSortiePending: boolean;
  readonly isThisPending: boolean;
  readonly onSortie: (stageId: string) => void;
}

export const StageCard = ({
  item,
  isSortiePending,
  isThisPending,
  onSortie,
}: StageCardProps) => {
  const {
    master,
    status,
    isUnlocked,
    isFirstClearBonusAvailable,
    unlockRequirementName,
  } = item;
  const isDisabled = !isUnlocked || isSortiePending;

  return (
    <Card.Root
      className={
        isUnlocked
          ? "border-border bg-card"
          : "border-border bg-muted/60 opacity-85"
      }
    >
      <Card.Header>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Heading as="h3">{master.name}</Heading>
            <Text size="caption" tone="muted" className="tabular-nums">
              全{master.waves.length}ウェーブ / 推奨穢れ度 {master.corruptionLevel}
            </Text>
          </div>
          <StatusBadge status={status} />
        </div>
      </Card.Header>

      <Card.Content className="flex flex-col gap-3">
        <Text size="body">{master.description}</Text>

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="tabular-nums">
            報酬: 勾玉 +{master.clearReward.magatama}
          </Badge>
          <Badge variant="default" className="tabular-nums">
            翡翠 +{master.clearReward.hisui}
          </Badge>
          {isFirstClearBonusAvailable && (
            <Badge variant="accent" className="tabular-nums">
              <Sparkles className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              初回ボーナス 翡翠 +{master.firstClearBonusHisui}
            </Badge>
          )}
        </div>

        {!isUnlocked && unlockRequirementName && (
          <Text size="caption" tone="muted">
            解放条件:「{unlockRequirementName}」浄化で解放
          </Text>
        )}
      </Card.Content>

      <Card.Footer>
        <Button
          type="button"
          variant={isUnlocked ? "primary" : "secondary"}
          disabled={isDisabled}
          className="min-h-11 w-full touch-manipulation"
          onClick={() => {
            onSortie(master.id);
          }}
        >
          {!isUnlocked ? (
            <>
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>未解放</span>
            </>
          ) : isThisPending ? (
            <span>出撃準備中…</span>
          ) : (
            <>
              <Swords className="h-4 w-4" aria-hidden="true" />
              <span>出撃する</span>
            </>
          )}
        </Button>
      </Card.Footer>
    </Card.Root>
  );
};
