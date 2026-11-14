import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Separator } from "@/components/ui/Separator";
import { Text } from "@/components/ui/Typography";
import { getGachaDropRates } from "@/domain";
import type { GachaPoolType } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolType: GachaPoolType;
}

export const GachaRatesModal = ({ open, onOpenChange, poolType }: Props) => {
  const rates = getGachaDropRates(poolType);
  const poolLabel = poolType === "character" ? "キャラ召喚" : "武器召喚";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>提供割合・排出一覧（{poolLabel}）</Dialog.Title>
          <Dialog.Description>
            全{rates.length}種が均等確率で抽選されます。
          </Dialog.Description>
        </Dialog.Header>

        <Separator className="my-3" />

        <ScrollArea.Root className="max-h-64 pr-2">
          <div className="flex flex-col gap-2">
            {rates.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
              >
                <Text className="font-medium">{entry.name}</Text>
                <Text className="font-bold text-primary" tabularNums>
                  {entry.ratePercent}%
                </Text>
              </div>
            ))}
          </div>
        </ScrollArea.Root>

        <Dialog.Footer className="mt-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            閉じる
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
};
