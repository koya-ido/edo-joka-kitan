import { MagatamaIcon } from "@/components/icons";
import { CurrencyPill } from "@/components/shared/CurrencyPill";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Text } from "@/components/ui/Typography";
import type { InGameUpgradeCategory, InGameUpgradeOption } from "@/types";
import { RefreshCw, Sparkles } from "lucide-react";

export interface LevelUpChoiceModalProps {
  readonly open: boolean;
  readonly level: number;
  readonly choices: readonly InGameUpgradeOption[];
  readonly currentMagatama: number;
  readonly rerollCostMagatama: number;
  readonly isRerolling: boolean;
  readonly onSelectChoice: (optionId: string) => void;
  readonly onReroll: () => void;
  readonly onFallbackContinue: () => void;
}

const CATEGORY_LABEL_MAP: Readonly<
  Record<
    InGameUpgradeCategory,
    { readonly label: string; readonly variant: "default" | "accent" | "success" }
  >
> = {
  base_stat: { label: "基礎強化", variant: "default" },
  weapon_stat: { label: "武器強化", variant: "accent" },
  weapon_unlock: { label: "新武器開放", variant: "success" },
};

export const LevelUpChoiceModal = ({
  open,
  choices,
  currentMagatama,
  rerollCostMagatama,
  isRerolling,
  onSelectChoice,
  onReroll,
  onFallbackContinue,
}: LevelUpChoiceModalProps) => {
  const canAffordReroll = currentMagatama >= rerollCostMagatama;
  const shortage = Math.max(0, rerollCostMagatama - currentMagatama);

  return (
    <Dialog.Root open={open}>
      <Dialog.Content isPending={isRerolling} hideCloseButton>
        <Dialog.Header>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
            <Dialog.Title>霊力昇華</Dialog.Title>
          </div>
          <Dialog.Description>
            獲得する術式を1つ選択してください。
          </Dialog.Description>
        </Dialog.Header>

        <div className="mt-4 space-y-3">
          {choices.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted p-4 text-center">
              <Text size="body" tone="muted">
                選択可能な術式がありません。
              </Text>
              <Button
                type="button"
                variant="primary"
                className="mt-3 w-full"
                onClick={onFallbackContinue}
              >
                戦闘を続ける
              </Button>
            </div>
          ) : (
            choices.map((option) => {
              const meta = CATEGORY_LABEL_MAP[option.category];
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isRerolling}
                  onClick={() => {
                    onSelectChoice(option.id);
                  }}
                  className="w-full min-h-14 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 touch-manipulation"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Text size="label" className="font-bold">
                      {option.title}
                    </Text>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                  <Text size="caption" tone="muted" className="mt-1">
                    {option.description}
                  </Text>
                </button>
              );
            })
          )}
        </div>

        <Dialog.Footer className="mt-5 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Text size="caption" tone="muted">
              所持:
            </Text>
            <CurrencyPill
              type="magatama"
              amount={currentMagatama}
              requiredAmount={rerollCostMagatama}
            />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button
              type="button"
              variant="secondary"
              isPending={isRerolling}
              disabled={!canAffordReroll || isRerolling || choices.length === 0}
              onClick={onReroll}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>再抽選</span>
              <MagatamaIcon className="h-4 w-4 text-magatama" aria-hidden="true" />
              <span className="tabular-nums">×{rerollCostMagatama}</span>
            </Button>
            {!canAffordReroll ? (
              <Text size="caption" tone="destructive">
                勾玉が {shortage} 個不足しています
              </Text>
            ) : null}
          </div>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
};
