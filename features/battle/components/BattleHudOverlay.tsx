import { WeaponSlotBar } from "@/components/shared/WeaponSlotBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Toggle } from "@/components/ui/Toggle";
import { Tooltip } from "@/components/ui/Tooltip";
import { Text } from "@/components/ui/Typography";
import type { BattleViewState } from "@/engine";
import { Pause } from "lucide-react";

export interface BattleHudOverlayProps {
  readonly stageName: string;
  readonly viewState: BattleViewState;
  readonly controlsDisabled: boolean;
  readonly onToggleSpeed: () => void;
  readonly onPause: () => void;
}

export const BattleHudOverlay = ({
  stageName,
  viewState,
  controlsDisabled,
  onToggleSpeed,
  onPause,
}: BattleHudOverlayProps) => {
  const { hud, buffState } = viewState;
  const isDoubleSpeed = hud.gameSpeed === 2;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3">
      <div className="pointer-events-auto flex flex-col gap-2 rounded-lg border border-border/30 bg-battle-surface/85 p-3 text-battle-foreground backdrop-blur-xs">
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
              <Tooltip.Content>等速 (1x) / 2倍速 (2x) 切替</Tooltip.Content>
            </Tooltip.Root>

            <Button
              type="button"
              variant="secondary"
              size="icon"
              disabled={controlsDisabled}
              onClick={onPause}
              aria-label="一時停止"
            >
              <Pause className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <Text size="caption" className="text-battle-foreground/85">
              結界耐久
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

      <div className="pointer-events-auto rounded-lg border border-border/30 bg-battle-surface/85 p-2 backdrop-blur-xs">
        <WeaponSlotBar
          unlockedWeaponIds={buffState.unlockedWeaponIds}
          compact
        />
      </div>
    </div>
  );
};
