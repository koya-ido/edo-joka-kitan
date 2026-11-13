import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { Gift, RotateCcw } from "lucide-react";

export interface HomeHeaderActionsProps {
  hasUnclaimedLoginBonus: boolean;
  disabled: boolean;
  onOpenLoginBonus: () => void;
  onOpenResetDialog: () => void;
}

export const HomeHeaderActions = ({
  hasUnclaimedLoginBonus,
  disabled,
  onOpenLoginBonus,
  onOpenResetDialog,
}: HomeHeaderActionsProps) => (
  <div className="flex items-center gap-1">
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={onOpenLoginBonus}
          aria-label="ログボ"
          className="relative min-h-11 gap-1 px-2.5 whitespace-nowrap"
        >
          <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold">ログボ</span>
          {hasUnclaimedLoginBonus && (
            <span
              aria-label="未受取あり"
              className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary"
            />
          )}
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>ログインボーナス確認</Tooltip.Content>
    </Tooltip.Root>

    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onOpenResetDialog}
          aria-label="初期化"
          className="min-h-11 gap-1 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive whitespace-nowrap"
        >
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold">初期化</span>
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>セーブデータ初期化</Tooltip.Content>
    </Tooltip.Root>
  </div>
);
