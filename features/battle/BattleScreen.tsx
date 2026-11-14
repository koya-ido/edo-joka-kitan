import { ConfirmAlertDialog } from "@/components/shared/ConfirmAlertDialog";
import { AspectRatio } from "@/components/ui/AspectRatio";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Text } from "@/components/ui/Typography";
import { BATTLE_FIELD_HEIGHT, BATTLE_FIELD_WIDTH } from "@/engine";
import { BattleErrorModal } from "@/features/battle/components/BattleErrorModal";
import { BattleHudOverlay } from "@/features/battle/components/BattleHudOverlay";
import { BattlePauseModal } from "@/features/battle/components/BattlePauseModal";
import { useBattleEngine } from "@/features/battle/hooks/useBattleEngine";
import type { PlayerSaveData } from "@/types";
import { Loader2 } from "lucide-react";

export interface BattleScreenProps {
  readonly save: PlayerSaveData;
  readonly stageId: string;
  readonly onExitToStages: () => void;
}

export const BattleScreen = ({
  save,
  stageId,
  onExitToStages,
}: BattleScreenProps) => {
  const {
    canvasRef,
    launchContext,
    viewState,
    fatalError,
    isInitializing,
    isRetreatConfirmOpen,
    isExiting,
    setRetreatConfirmOpen,
    toggleSpeed,
    pauseBattle,
    resumeBattle,
    confirmExitToStages,
  } = useBattleEngine(save, stageId);

  const phase = viewState?.hud.phase;
  const isPaused = phase === "paused" && !isRetreatConfirmOpen;
  const isOutcomeReached = phase === "victory" || phase === "defeat";
  const controlsDisabled =
    isInitializing ||
    phase === "paused" ||
    isRetreatConfirmOpen ||
    fatalError !== null ||
    isOutcomeReached ||
    isExiting;

  return (
    <section
      aria-label="バトル画面"
      className="relative flex flex-col items-center justify-center"
    >
      <div className="relative w-full overflow-hidden rounded-lg border border-border bg-battle-surface-deep shadow-md touch-manipulation">
        <AspectRatio ratio={BATTLE_FIELD_WIDTH / BATTLE_FIELD_HEIGHT}>
          <canvas
            ref={canvasRef}
            className="h-full w-full block"
            aria-label="穢土浄化戦闘キャンバス"
          />
        </AspectRatio>

        {isInitializing ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-battle-surface-deep/90 text-battle-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
            <Text size="caption" className="text-battle-foreground">
              結界を展開中…
            </Text>
          </div>
        ) : null}

        {launchContext && viewState ? (
          <BattleHudOverlay
            stageName={launchContext.stage.name}
            viewState={viewState}
            controlsDisabled={controlsDisabled}
            onToggleSpeed={toggleSpeed}
            onPause={pauseBattle}
          />
        ) : null}
      </div>

      {launchContext && viewState ? (
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

      <Dialog.Root open={isOutcomeReached && fatalError === null}>
        <Dialog.Content isPending={isExiting} hideCloseButton>
          <Dialog.Header>
            <Dialog.Title>
              {phase === "victory" ? "ステージ浄化完了" : "結界決壊"}
            </Dialog.Title>
            <Dialog.Description>
              {phase === "victory"
                ? "すべての妖怪を祓いました。"
                : "守護結界が破られました。"}
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer className="mt-6">
            <Button
              type="button"
              variant="primary"
              isPending={isExiting}
              disabled={isExiting}
              onClick={() => {
                confirmExitToStages(onExitToStages);
              }}
            >
              ステージ選択へ戻る
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </section>
  );
};
