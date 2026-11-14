import { CurrencyPill } from "@/components/shared/CurrencyPill";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Separator } from "@/components/ui/Separator";
import { Text } from "@/components/ui/Typography";
import { STAGE_MASTER_MAP } from "@/data";
import type { BattleResultPayload } from "@/types";
import { AlertTriangle, Loader2, ShieldAlert, Trophy } from "lucide-react";

export interface BattleResultModalProps {
  readonly open: boolean;
  readonly phase: "victory" | "defeat" | null;
  readonly stageName: string;
  readonly reachedWave: number;
  readonly totalWaves: number;
  readonly isCommitting: boolean;
  readonly committedReward: BattleResultPayload | null;
  readonly commitError: string | null;
  readonly isExiting: boolean;
  readonly onRetryCommit: () => void;
  readonly onRetryBattle?: () => void;
  readonly onExitToStages: () => void;
}

export const BattleResultModal = ({
  open,
  phase,
  stageName,
  reachedWave,
  totalWaves,
  isCommitting,
  committedReward,
  commitError,
  isExiting,
  onRetryCommit,
  onRetryBattle,
  onExitToStages,
}: BattleResultModalProps) => {
  const isVictory = phase === "victory";
  const unlockedStageName =
    committedReward?.newlyUnlockedStageId &&
      Object.hasOwn(STAGE_MASTER_MAP, committedReward.newlyUnlockedStageId)
      ? STAGE_MASTER_MAP[committedReward.newlyUnlockedStageId].name
      : null;

  return (
    <Dialog.Root open={open}>
      <Dialog.Content isPending={isCommitting || isExiting} hideCloseButton>
        <Dialog.Header>
          <div className="flex items-center gap-2">
            {isVictory ? (
              <Trophy className="h-5 w-5 text-success" aria-hidden="true" />
            ) : (
              <ShieldAlert
                className="h-5 w-5 text-destructive"
                aria-hidden="true"
              />
            )}
            <Dialog.Title>
              {isVictory ? "ステージ浄化完了" : "結界崩壊"}
            </Dialog.Title>
          </div>
          <Dialog.Description>
            {stageName} — 到達 Wave {reachedWave} / {totalWaves}
          </Dialog.Description>
        </Dialog.Header>

        <div className="mt-4 space-y-3">
          {isCommitting ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted p-4">
              <Loader2
                className="h-5 w-5 animate-spin text-primary"
                aria-hidden="true"
              />
              <Text size="body">報酬を保存中…</Text>
            </div>
          ) : commitError ? (
            <div
              role="alert"
              className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4"
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <Text size="label" tone="destructive">
                  報酬の保存に失敗しました
                </Text>
              </div>
              <Text size="caption" tone="destructive">
                {commitError}
              </Text>
            </div>
          ) : committedReward ? (
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <Text size="label">
                  {isVictory ? "浄化報酬" : "救済報酬"}
                </Text>
                <Badge variant={isVictory ? "success" : "destructive"}>
                  {isVictory ? "勝利" : "敗北"}
                </Badge>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center gap-3">
                <CurrencyPill
                  type="magatama"
                  amount={committedReward.earnedMagatama}
                />
                {committedReward.earnedHisui > 0 ? (
                  <CurrencyPill
                    type="hisui"
                    amount={committedReward.earnedHisui}
                  />
                ) : null}
              </div>
              {unlockedStageName ? (
                <div className="rounded-md bg-success/10 px-3 py-2">
                  <Text size="caption" tone="success" className="font-semibold">
                    次節解放: {unlockedStageName}
                  </Text>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <Dialog.Footer className="mt-6 flex-col gap-2 sm:flex-row sm:justify-end">
          {commitError ? (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={isCommitting || isExiting}
                onClick={onExitToStages}
              >
                保存せず戻る
              </Button>
              <Button
                type="button"
                variant="primary"
                isPending={isCommitting}
                disabled={isCommitting || isExiting}
                onClick={onRetryCommit}
              >
                再試行して受け取る
              </Button>
            </>
          ) : !isVictory && onRetryBattle ? (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={isCommitting || isExiting || committedReward === null}
                onClick={onExitToStages}
              >
                ステージ選択へ戻る
              </Button>
              <Button
                type="button"
                variant="primary"
                isPending={isCommitting || isExiting}
                disabled={isCommitting || isExiting || committedReward === null}
                onClick={onRetryBattle}
              >
                再チャレンジ
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="primary"
              isPending={isCommitting || isExiting}
              disabled={isCommitting || isExiting || committedReward === null}
              onClick={onExitToStages}
            >
              ステージ選択へ戻る
            </Button>
          )}
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
};
