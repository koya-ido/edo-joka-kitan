import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heading, Text } from "@/components/ui/Typography";
import { EquippedSummaryBar } from "@/features/stage-select/components/EquippedSummaryBar";
import { StageCard } from "@/features/stage-select/components/StageCard";
import { useStageSelect } from "@/features/stage-select/hooks/useStageSelect";
import type { PlayerSaveData, StageMaster } from "@/types";
import { AlertTriangle, Home } from "lucide-react";

export interface StageSelectScreenProps {
  readonly save: PlayerSaveData;
  readonly isSessionPending?: boolean;
  readonly stageMasters?: readonly StageMaster[];
  readonly onNavigate: (to: string) => void;
}

export const StageSelectScreen = ({
  save,
  isSessionPending = false,
  stageMasters,
  onNavigate,
}: StageSelectScreenProps) => {
  const {
    items,
    equippedSummary,
    isSortiePending,
    pendingStageId,
    sortieError,
    handleSortie,
    handleOpenFormation,
  } = useStageSelect({
    save,
    isSessionPending,
    stageMasters,
    onNavigate,
  });

  const isLocked = isSortiePending || isSessionPending;
  const nextUnverifiedItem = items.find(
    (item) => item.isUnlocked && !item.isCleared,
  );
  const visibleItems = items.filter(
    (item) => item.isCleared || item === nextUnverifiedItem,
  );
  const orderedItems = [...visibleItems].reverse();

  return (
    <div className="flex flex-col gap-4">
      {sortieError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <Text size="body" tone="destructive">
            {sortieError.message}
          </Text>
        </div>
      )}

      <EquippedSummaryBar
        summary={equippedSummary}
        isDisabled={isLocked}
        onOpenFormation={handleOpenFormation}
      />

      {orderedItems.length === 0 ? (
        <Card.Root>
          <Card.Header>
            <Heading as="h2">選択可能な土地がありません</Heading>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            <Text tone="muted">
              現在出撃できるステージ情報が読み込めませんでした。ホームへ戻って再度お試しください。
            </Text>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 w-full touch-manipulation"
              onClick={() => {
                onNavigate("/");
              }}
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>ホームへ戻る</span>
            </Button>
          </Card.Content>
        </Card.Root>
      ) : (
        <section aria-label="出撃ステージ一覧" className="flex flex-col gap-3">
          {orderedItems.map((item) => (
            <StageCard
              key={item.master.id}
              item={item}
              isSortiePending={isLocked}
              isThisPending={pendingStageId === item.master.id}
              onSortie={handleSortie}
            />
          ))}
        </section>
      )}
    </div>
  );
};
