import { WeaponSlotBar } from "@/components/shared/WeaponSlotBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Separator } from "@/components/ui/Separator";
import { Text } from "@/components/ui/Typography";
import type { BattleLaunchContext } from "@/domain";
import type { BattleViewState } from "@/engine";
import { LogOut, Play } from "lucide-react";

export interface BattlePauseModalProps {
  readonly open: boolean;
  readonly isPending: boolean;
  readonly launchContext: BattleLaunchContext;
  readonly viewState: BattleViewState;
  readonly onResume: () => void;
  readonly onRequestRetreat: () => void;
}

export const BattlePauseModal = ({
  open,
  isPending,
  launchContext,
  viewState,
  onResume,
  onRequestRetreat,
}: BattlePauseModalProps) => {
  const { character, metaStats } = launchContext;
  const { buffState } = viewState;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) {
          onResume();
        }
      }}
    >
      <Dialog.Content isPending={isPending}>
        <Dialog.Header>
          <Dialog.Title>戦闘一時停止</Dialog.Title>
          <Dialog.Description>
            現在の編成・強化状態を確認できます。
          </Dialog.Description>
        </Dialog.Header>

        <div className="mt-4 flex flex-col gap-3">
          <Card.Root className="bg-background/70">
            <Card.Content className="flex flex-col gap-2 py-3">
              <div className="flex items-center justify-between">
                <Text size="label">{character.name}</Text>
                <Badge variant="accent">{character.passiveSkill.name}</Badge>
              </div>
              <Text size="caption" tone="muted">
                {character.passiveSkill.description}
              </Text>
              <Separator />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <Text size="caption" tone="muted">
                    耐久値
                  </Text>
                  <Text size="label" tabularNums className="block">
                    {metaStats.hp}
                  </Text>
                </div>
                <div>
                  <Text size="caption" tone="muted">
                    攻撃力
                  </Text>
                  <Text size="label" tabularNums className="block">
                    {Math.round(metaStats.atk * buffState.atkMultiplier)}
                  </Text>
                </div>
                <div>
                  <Text size="caption" tone="muted">
                    会心率
                  </Text>
                  <Text size="label" tabularNums className="block">
                    {metaStats.luk + buffState.critRateBonusPct}%
                  </Text>
                </div>
              </div>
            </Card.Content>
          </Card.Root>

          <div>
            <Text size="caption" tone="muted" className="mb-1 block">
              解放中の武器スロット
            </Text>
            <WeaponSlotBar unlockedWeaponIds={buffState.unlockedWeaponIds} />
          </div>
        </div>

        <Dialog.Footer className="mt-6">
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={onRequestRetreat}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            ステージ選択へ撤退
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={isPending}
            onClick={onResume}
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            戦闘を再開
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
};
