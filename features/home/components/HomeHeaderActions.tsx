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
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onOpenLoginBonus}
          aria-label="ログボ"
          className={
            hasUnclaimedLoginBonus
              ? "relative min-h-11 gap-1 border border-accent/70 bg-accent/20 px-2 text-accent hover:bg-accent/30 whitespace-nowrap"
              : "relative min-h-11 gap-1 border border-battle-foreground/15 bg-battle-foreground/5 px-2 text-battle-foreground/85 hover:bg-battle-foreground/15 whitespace-nowrap"
          }
        >
          <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold">ログボ</span>
          {hasUnclaimedLoginBonus && (
            <span
              aria-label="未受取あり"
              className="absolute top-1 right-1 h-2 w-2 animate-pulse rounded-full bg-primary ring-2 ring-battle-surface"
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
          size="icon"
          disabled={disabled}
          onClick={onOpenResetDialog}
          aria-label="初期化"
          className="min-h-11 min-w-11 border border-battle-foreground/15 bg-battle-foreground/5 text-battle-foreground/70 hover:border-destructive/60 hover:bg-destructive/20 hover:text-destructive-foreground"
        >
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>セーブデータ初期化</Tooltip.Content>
    </Tooltip.Root>
  </div>
);
