import { Tabs } from "@/components/ui/Tabs";
import { GachaPoolPanel } from "@/features/gacha/components/GachaPoolPanel";
import { GachaRatesModal } from "@/features/gacha/components/GachaRatesModal";
import { GachaResultModal } from "@/features/gacha/components/GachaResultModal";
import { GachaSummonAnimationOverlay } from "@/features/gacha/components/GachaSummonAnimationOverlay";
import type { GachaActionsState } from "@/features/gacha/hooks/useGachaActions";
import type { PlayerSaveData } from "@/types";

interface Props {
  save: PlayerSaveData;
  actions: GachaActionsState;
  isSessionPending: boolean;
}

export const GachaScreen = ({ save, actions, isSessionPending }: Props) => {
  const isDisabled = isSessionPending || actions.isMutating;

  return (
    <div className="flex flex-col gap-4">
      <Tabs.Root
        value={actions.activePool}
        onValueChange={(value) => {
          if (value === "character" || value === "weapon") {
            actions.setActivePool(value);
          }
        }}
      >
        <Tabs.List aria-label="召喚プール選択">
          <Tabs.Trigger value="character" disabled={isDisabled}>
            キャラ召喚
          </Tabs.Trigger>
          <Tabs.Trigger value="weapon" disabled={isDisabled}>
            武器召喚
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="character">
          <GachaPoolPanel
            poolType="character"
            hisuiBalance={save.currencies.hisui}
            isPulling={actions.isPulling}
            isDisabled={isDisabled}
            onPull={(pool, count) => {
              void actions.handlePull(pool, count);
            }}
            onOpenRates={() => {
              actions.setRatesModalOpen(true);
            }}
          />
        </Tabs.Content>

        <Tabs.Content value="weapon">
          <GachaPoolPanel
            poolType="weapon"
            hisuiBalance={save.currencies.hisui}
            isPulling={actions.isPulling}
            isDisabled={isDisabled}
            onPull={(pool, count) => {
              void actions.handlePull(pool, count);
            }}
            onOpenRates={() => {
              actions.setRatesModalOpen(true);
            }}
          />
        </Tabs.Content>
      </Tabs.Root>

      <GachaSummonAnimationOverlay
        open={actions.isAnimating}
        result={actions.pendingResult}
        onSkip={actions.skipAnimation}
      />

      <GachaResultModal
        open={actions.resultModalOpen}
        onOpenChange={actions.setResultModalOpen}
        result={actions.pendingResult}
      />

      <GachaRatesModal
        open={actions.ratesModalOpen}
        onOpenChange={actions.setRatesModalOpen}
        poolType={actions.activePool}
      />
    </div>
  );
};
