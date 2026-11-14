import { useAppToast } from "@/components/shared/AppToastProvider";
import { ConfirmAlertDialog } from "@/components/shared/ConfirmAlertDialog";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Typography";
import { BattleErrorModal } from "@/features/battle/components/BattleErrorModal";
import { BattleHudOverlay } from "@/features/battle/components/BattleHudOverlay";
import { BattlePauseModal } from "@/features/battle/components/BattlePauseModal";
import { BattleResultModal } from "@/features/battle/components/BattleResultModal";
import { LevelUpChoiceModal } from "@/features/battle/components/LevelUpChoiceModal";
import { useBattleEngine } from "@/features/battle/hooks/useBattleEngine";
import type { PlayerSaveData } from "@/types";
import { Loader2, Pause } from "lucide-react";

export interface BattleScreenProps {
  readonly save: PlayerSaveData;
  readonly stageId: string;
  readonly onSaveCommitted?: (nextSave: PlayerSaveData) => void;
  readonly onExitToStages: () => void;
}

export const BattleScreen = ({
  save,
  stageId,
  onSaveCommitted,
  onExitToStages,
}: BattleScreenProps) => {
  const { showErrorToast } = useAppToast();
  const {
    canvasRef,
    launchContext,
    viewState,
    fatalError,
    isInitializing,
    isRetreatConfirmOpen,
    isExiting,
    isRerolling,
    isCommitting,
    committedReward,
    commitError,
    setRetreatConfirmOpen,
    toggleSpeed,
    pauseBattle,
    resumeBattle,
    selectUpgradeChoice,
    rerollChoices,
    retryCommitResult,
    retryBattle,
    confirmExitToStages,
  } = useBattleEngine(save, stageId, {
    onSaveCommitted,
    onNotifyError: showErrorToast,
  });

  const phase = viewState?.hud.phase;
  const isPaused = phase === "paused" && !isRetreatConfirmOpen;
  const isLevelUp = phase === "level_up_modal" && fatalError === null;
  const isOutcomeReached = phase === "victory" || phase === "defeat";
  const controlsDisabled =
    isInitializing ||
    phase === "paused" ||
    phase === "level_up_modal" ||
    isRetreatConfirmOpen ||
    fatalError !== null ||
    isOutcomeReached ||
    isRerolling ||
    isCommitting ||
    isExiting;

  return (
    <section
      aria-label="バトル画面"
      className="relative flex flex-1 flex-col bg-battle-surface-deep"
    >
      <div className="relative flex-1 min-h-0 w-full overflow-hidden touch-manipulation">
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          aria-label="穢土浄化戦闘キャンバス"
        />

        {launchContext && viewState ? (
          <div className="absolute top-0 left-0 z-10 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={controlsDisabled}
              onClick={pauseBattle}
              aria-label="一時停止"
              className="min-h-11 min-w-11 rounded-lg border border-border/30 bg-battle-surface/65 text-battle-foreground backdrop-blur-xs hover:bg-battle-surface/85"
            >
              <Pause className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        ) : null}

        {isInitializing ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-battle-surface-deep/90 text-battle-foreground">
            <Loader2
              className="h-7 w-7 animate-spin text-primary"
              aria-hidden="true"
            />
            <Text size="caption" className="text-battle-foreground">
              結界を展開中…
            </Text>
          </div>
        ) : null}
      </div>

      {launchContext && viewState ? (
        <BattleHudOverlay
          stageName={launchContext.stage.name}
          viewState={viewState}
          controlsDisabled={controlsDisabled}
          onToggleSpeed={toggleSpeed}
        />
      ) : null}

      {launchContext && viewState ? (
        <>
          <BattlePauseModal
            open={isPaused}
            isPending={isExiting}
            launchContext={launchContext}
            viewState={viewState}
            onResume={resumeBattle}
            onRequestRetreat={() => {
              setRetreatConfirmOpen(true);
            }}
          />

          <LevelUpChoiceModal
            open={isLevelUp}
            level={viewState.hud.level}
            choices={viewState.hud.pendingUpgradeChoices}
            currentMagatama={save.currencies.magatama}
            rerollCostMagatama={viewState.hud.rerollCostMagatama}
            isRerolling={isRerolling}
            onSelectChoice={selectUpgradeChoice}
            onReroll={() => {
              void rerollChoices();
            }}
            onFallbackContinue={resumeBattle}
          />

          <BattleResultModal
            open={isOutcomeReached && fatalError === null}
            phase={
              phase === "victory" || phase === "defeat" ? phase : null
            }
            stageName={launchContext.stage.name}
            reachedWave={viewState.hud.currentWave}
            totalWaves={viewState.hud.totalWaves}
            isCommitting={isCommitting}
            committedReward={committedReward}
            commitError={commitError}
            isExiting={isExiting}
            onRetryCommit={() => {
              void retryCommitResult();
            }}
            onRetryBattle={retryBattle}
            onExitToStages={() => {
              confirmExitToStages(onExitToStages);
            }}
          />
        </>
      ) : null}

      <ConfirmAlertDialog
        open={isRetreatConfirmOpen}
        onOpenChange={(nextOpen) => {
          if (!isExiting) {
            setRetreatConfirmOpen(nextOpen);
          }
        }}
        title="戦闘から撤退しますか？"
        description="進行中の戦闘状態は破棄され、ステージ選択画面へ戻ります。"
        confirmLabel="撤退する"
        cancelLabel="戦闘に戻る"
        isPending={isExiting}
        onConfirm={() => {
          confirmExitToStages(onExitToStages);
        }}
      />

      <BattleErrorModal
        open={fatalError !== null}
        message={fatalError ?? "戦闘処理で問題が発生しました。"}
        isPending={isExiting}
        onExitToStages={() => {
          confirmExitToStages(onExitToStages);
        }}
      />
    </section>
  );
};
