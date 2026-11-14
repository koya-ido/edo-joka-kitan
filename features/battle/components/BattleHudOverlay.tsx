import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Toggle } from "@/components/ui/Toggle";
import { Tooltip } from "@/components/ui/Tooltip";
import { Text } from "@/components/ui/Typography";
import type { BattleViewState } from "@/engine";
import { Volume2, VolumeX } from "lucide-react";

export interface BattleHudOverlayProps {
  readonly stageName: string;
  readonly viewState: BattleViewState;
  readonly controlsDisabled: boolean;
  readonly isMuted: boolean;
  readonly onToggleMute: () => void;
  readonly onToggleSpeed: () => void;
}

export const BattleHudOverlay = ({
  stageName,
  viewState,
  controlsDisabled,
  isMuted,
  onToggleMute,
  onToggleSpeed,
}: BattleHudOverlayProps) => {
  const { hud } = viewState;
  const isDoubleSpeed = hud.gameSpeed === 2;

  return (
    <div className="z-10 shrink-0 border-t border-border/30 bg-battle-surface px-3 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-battle-foreground">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <Text
              size="caption"
              className="block truncate text-battle-foreground/80"
            >
              {stageName}
            </Text>
            <div className="flex items-center gap-2">
              <Text
                size="label"
                tabularNums
                className="font-bold text-battle-foreground"
              >
                Wave {hud.currentWave} / {hud.totalWaves}
              </Text>
              {hud.phase === "preparing" ? (
                <Badge variant="accent">開戦準備中</Badge>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Toggle
                  pressed={isMuted}
                  disabled={controlsDisabled}
                  onPressedChange={() => {
                    onToggleMute();
                  }}
                  aria-label="効果音ミュート切替"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Volume2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </Toggle>
              </Tooltip.Trigger>
              <Tooltip.Content>効果音 ON / OFF</Tooltip.Content>
            </Tooltip.Root>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Toggle
                  pressed={isDoubleSpeed}
                  disabled={controlsDisabled}
                  onPressedChange={() => {
                    onToggleSpeed();
                  }}
                  aria-label="戦闘速度切替"
                >
                  {isDoubleSpeed ? "2x" : "1x"}
                </Toggle>
              </Tooltip.Trigger>
              <Tooltip.Content>等速 / 2倍速 切替</Tooltip.Content>
            </Tooltip.Root>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <Text size="caption" className="text-battle-foreground/85">
              耐久値
            </Text>
            <Text
              size="caption"
              tabularNums
              className="font-bold text-battle-foreground"
            >
              {hud.barrierHp} / {hud.barrierMaxHp}
            </Text>
          </div>
          <Progress.Root value={hud.barrierHp} max={hud.barrierMaxHp}>
            <Progress.Indicator
              variant="barrier"
              value={hud.barrierHp}
              max={hud.barrierMaxHp}
            />
          </Progress.Root>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <Text size="caption" className="text-battle-foreground/85">
              霊力 Lv.{hud.level}
            </Text>
            <Text
              size="caption"
              tabularNums
              className="font-bold text-battle-foreground"
            >
              {hud.exp} / {hud.expToNextLevel}
            </Text>
          </div>
          <Progress.Root value={hud.exp} max={hud.expToNextLevel} className="h-2">
            <Progress.Indicator
              variant="exp"
              value={hud.exp}
              max={hud.expToNextLevel}
            />
          </Progress.Root>
        </div>
      </div>
    </div>
  );
};
