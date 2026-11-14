import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Text } from "@/components/ui/Typography";
import { AlertTriangle } from "lucide-react";

export interface BattleErrorModalProps {
  readonly open: boolean;
  readonly message: string;
  readonly isPending: boolean;
  readonly onExitToStages: () => void;
}

export const BattleErrorModal = ({
  open,
  message,
  isPending,
  onExitToStages,
}: BattleErrorModalProps) => (
  <Dialog.Root open={open}>
    <Dialog.Content isPending={isPending} hideCloseButton>
      <Dialog.Header>
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          <Dialog.Title>戦闘処理エラー</Dialog.Title>
        </div>
        <Dialog.Description>
          安全のため戦闘ループを停止しました。
        </Dialog.Description>
      </Dialog.Header>

      <Text className="mt-3 text-card-foreground">{message}</Text>

      <Dialog.Footer className="mt-6">
        <Button
          type="button"
          variant="primary"
          isPending={isPending}
          disabled={isPending}
          onClick={onExitToStages}
        >
          ステージ選択へ戻る
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
);
