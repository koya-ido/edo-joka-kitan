import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import { Tooltip } from "@/components/ui/Tooltip";
import { Calendar, RotateCcw, User } from "lucide-react";
import { useState } from "react";

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
}: HomeHeaderActionsProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={onOpenLoginBonus}
            aria-label="ログボ"
            className={
              hasUnclaimedLoginBonus
                ? "relative min-h-11 min-w-11 border border-accent/70 bg-accent/20 text-accent hover:bg-accent/30"
                : "relative min-h-11 min-w-11 border border-battle-foreground/15 bg-battle-foreground/5 text-battle-foreground/85 hover:bg-battle-foreground/15"
            }
          >
            <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
            {hasUnclaimedLoginBonus && (
              <span
                aria-label="未受取あり"
                className="absolute top-1.5 right-1.5 h-2 w-2 animate-pulse rounded-full bg-primary ring-2 ring-battle-surface"
              />
            )}
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>ログインボーナス確認</Tooltip.Content>
      </Tooltip.Root>

      <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Popover.Trigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label="プレイヤーメニュー"
            className="min-h-11 min-w-11 rounded-full border border-battle-foreground/15 bg-battle-foreground/5 text-battle-foreground/85 hover:bg-battle-foreground/15"
          >
            <User className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Button>
        </Popover.Trigger>
        <Popover.Content align="end" className="w-44 p-1.5">
          <div role="menu" className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              role="menuitem"
              disabled={disabled}
              onClick={() => {
                setMenuOpen(false);
                onOpenResetDialog();
              }}
              className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>初期化</span>
            </Button>
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
};
