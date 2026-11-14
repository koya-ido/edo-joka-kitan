import { ItemAvatar } from "@/components/shared/ItemAvatar";
import { StatusBadge, type DomainStatusType } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Heading, Text } from "@/components/ui/Typography";
import type { GachaExecutionOutput, GachaPullResultItem } from "@/domain";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: GachaExecutionOutput | null;
}

const mapOutcomeToStatus = (item: GachaPullResultItem): DomainStatusType => {
  if (item.outcome === "new") {
    return "new";
  }
  if (item.outcome === "converted_to_magatama") {
    return "converted";
  }
  return item.poolType === "character" ? "awakening" : "refine";
};

const formatLevelProgress = (item: GachaPullResultItem): string => {
  if (item.outcome === "new") {
    return "Lv.0（初獲得）";
  }
  if (item.outcome === "awakening_or_refine") {
    return `Lv.${String(item.previousLevel ?? 0)} → Lv.${String(item.nextLevel)}`;
  }
  return `Lv.${String(item.nextLevel)}（上限到達）`;
};

export const GachaResultModal = ({ open, onOpenChange, result }: Props) => {
  if (!result) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>召喚結果</Dialog.Title>
          <Dialog.Description>
            消費翡翠: {result.spentHisui} 個（{result.items.length}回召喚）
          </Dialog.Description>
        </Dialog.Header>

        {result.totalConvertedMagatama > 0 && (
          <div className="mt-2 rounded-md border border-warning/40 bg-warning/15 px-3 py-2">
            <Text size="caption" className="font-semibold text-foreground">
              上限到達により余剰分を水晶の勾玉 +
              <span className="tabular-nums">{result.totalConvertedMagatama}</span>{" "}
              へ自動変換しました
            </Text>
          </div>
        )}

        <ScrollArea.Root className="mt-3 max-h-72 pr-2">
          <div className="flex flex-col gap-2">
            {result.items.map((item, idx) => (
              <div
                key={`${item.targetId}-${String(idx)}`}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <ItemAvatar
                    kind={item.poolType}
                    name={item.name}
                    badgeLabel={`Lv.${String(item.nextLevel)}`}
                    size="sm"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <Heading as="h4" className="truncate text-sm">
                      {item.name}
                    </Heading>
                    <Text size="caption" tone="muted" tabularNums>
                      {formatLevelProgress(item)}
                    </Text>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={mapOutcomeToStatus(item)} />
                  {item.convertedMagatama > 0 && (
                    <Text size="caption" className="font-bold text-magatama" tabularNums>
                      +{item.convertedMagatama} 勾玉
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea.Root>

        <Dialog.Footer className="mt-4">
          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            確認する
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
};
