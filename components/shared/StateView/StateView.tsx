import { ConfirmAlertDialog } from "@/components/shared/ConfirmAlertDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heading, Text } from "@/components/ui/Typography";
import type { DomainError } from "@/types";
import { AlertTriangle, Lock, RotateCcw, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";

export type ViewStateStatus =
  | "loading"
  | "empty"
  | "success"
  | "error"
  | "disabled";

export interface StateViewProps {
  status: ViewStateStatus;
  error?: DomainError | null;
  isPending?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  disabledMessage?: string;
  onRetry?: () => void | Promise<void>;
  onResetSave?: () => void | Promise<void>;
  children: ReactNode;
}

export const StateView = ({
  status,
  error,
  isPending = false,
  emptyTitle = "表示できる項目がありません",
  emptyDescription = "条件を満たすデータがまだ存在しません。",
  emptyActionLabel,
  onEmptyAction,
  disabledMessage = "現在この操作は利用できません。",
  onRetry,
  onResetSave,
  children,
}: StateViewProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (status === "loading") {
    return (
      <Card.Root aria-busy="true" aria-live="polite" className="my-4">
        <Card.Content className="flex flex-col items-center gap-3 py-10 text-center">
          <Sparkles className="h-6 w-6 animate-pulse text-primary" aria-hidden="true" />
          <Text size="label">霊脈接続中…</Text>
          <Text size="caption" tone="muted">
            セーブデータと結界状態を読み込んでいます
          </Text>
        </Card.Content>
      </Card.Root>
    );
  }

  if (status === "error") {
    const isCorrupted = error?.code === "SAVE_CORRUPTED";
    return (
      <Card.Root role="alert" className="my-4 border-destructive/40">
        <Card.Header>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <Heading as="h2">霊脈の読み込みに失敗しました</Heading>
          </div>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <Text tone="destructive">
            {error?.message ?? "データの読み込み中に問題が発生しました。"}
          </Text>
          <div className="flex flex-wrap gap-3">
            {onRetry && (
              <Button
                variant="primary"
                isPending={isPending}
                onClick={() => {
                  void onRetry();
                }}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                再試行
              </Button>
            )}
            {isCorrupted && onResetSave && (
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  setConfirmOpen(true);
                }}
              >
                セーブデータを初期化して復旧
              </Button>
            )}
          </div>
        </Card.Content>
        {isCorrupted && onResetSave && (
          <ConfirmAlertDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            isPending={isPending}
            title="セーブデータを初期化しますか？"
            description="破損した記録を破棄し、初期状態（見習い陰陽師・翡翠5個・勾玉100個）へ復旧します。この操作は取り消せません。"
            confirmLabel="初期化して復旧する"
            onConfirm={async () => {
              await onResetSave();
              setConfirmOpen(false);
            }}
          />
        )}
      </Card.Root>
    );
  }

  if (status === "empty") {
    return (
      <Card.Root className="my-4">
        <Card.Content className="flex flex-col items-center gap-3 py-8 text-center">
          <Heading as="h3">{emptyTitle}</Heading>
          <Text tone="muted">{emptyDescription}</Text>
          {emptyActionLabel && onEmptyAction && (
            <Button variant="secondary" onClick={onEmptyAction} disabled={isPending}>
              {emptyActionLabel}
            </Button>
          )}
        </Card.Content>
      </Card.Root>
    );
  }

  if (status === "disabled") {
    return (
      <Card.Root className="my-4 bg-muted/50">
        <Card.Content className="flex items-center gap-3 py-6">
          <Lock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Text tone="muted">{disabledMessage}</Text>
        </Card.Content>
      </Card.Root>
    );
  }

  return <>{children}</>;
};
