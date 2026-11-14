import { CurrencyPill } from "@/components/shared/CurrencyPill";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Text } from "@/components/ui/Typography";
import { LOGIN_BONUS_CONFIG } from "@/data";
import { CheckCircle2, Gift } from "lucide-react";

export interface LoginBonusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canClaim: boolean;
  isPending: boolean;
  onClaim: () => void | Promise<void>;
}

export const LoginBonusModal = ({
  open,
  onOpenChange,
  canClaim,
  isPending,
  onClaim,
}: LoginBonusModalProps) => (
  <Dialog.Root
    open={open}
    onOpenChange={(nextOpen) => {
      if (isPending && !nextOpen) {
        return;
      }
      onOpenChange(nextOpen);
    }}
  >
    <Dialog.Content isPending={isPending}>
      <Dialog.Header>
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" aria-hidden="true" />
          <Dialog.Title>本日のログインボーナス</Dialog.Title>
        </div>
        <Dialog.Description>
          毎日 0:00（ローカル時刻）以降に1回、祓いの旅路を支える霊力通貨を受け取れます。
        </Dialog.Description>
      </Dialog.Header>

      <Card.Root className="mt-4 border-2 border-accent/55 bg-battle-surface bg-none text-battle-foreground shadow-md">
        <Card.Content className="flex flex-col gap-3 pt-3.5 pb-4">
          <div className="flex items-center justify-between">
            <Text size="caption" className="font-semibold text-battle-foreground/80">
              本日の報酬内容
            </Text>
            <Badge variant={canClaim ? "accent" : "success"}>
              {canClaim ? "受取可能" : "受取済み"}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-md border border-accent/25 bg-battle-surface-deep/70 py-3">
            <CurrencyPill type="magatama" amount={LOGIN_BONUS_CONFIG.magatama} />
            <CurrencyPill type="hisui" amount={LOGIN_BONUS_CONFIG.hisui} />
          </div>
        </Card.Content>
      </Card.Root>

      <Dialog.Footer>
        <Button
          variant="secondary"
          disabled={isPending}
          onClick={() => {
            onOpenChange(false);
          }}
        >
          閉じる
        </Button>
        <Button
          variant="primary"
          disabled={!canClaim || isPending}
          isPending={isPending}
          onClick={() => {
            void onClaim();
          }}
        >
          {canClaim ? (
            "受け取る"
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              本日分は受取済み
            </span>
          )}
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
);
