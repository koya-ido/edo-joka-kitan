import { StatSummaryGrid } from "@/components/shared/StatSummaryGrid";
import { Tabs } from "@/components/ui/Tabs";
import { Text } from "@/components/ui/Typography";
import { CHARACTER_MASTER_MAP, ENHANCE_STAT_CONFIGS } from "@/data";
import { calculateTotalMetaStats, getOwnedWeaponEntries } from "@/domain";
import { EnhanceStatCard } from "@/features/enhance/components/EnhanceStatCard";
import { EnhanceWeaponCard } from "@/features/enhance/components/EnhanceWeaponCard";
import type {
  EnhanceActionsState,
  EnhanceTab,
} from "@/features/enhance/hooks/useEnhanceActions";
import type { PlayerSaveData } from "@/types";

export interface EnhanceScreenProps {
  save: PlayerSaveData;
  actions: EnhanceActionsState;
  isSessionPending?: boolean;
}

export const EnhanceScreen = ({
  save,
  actions,
  isSessionPending = false,
}: EnhanceScreenProps) => {
  const charMaster = Object.hasOwn(
    CHARACTER_MASTER_MAP,
    save.equippedCharacterId,
  )
    ? CHARACTER_MASTER_MAP[save.equippedCharacterId]
    : undefined;

  const totalStats = charMaster
    ? calculateTotalMetaStats(save, charMaster)
    : { hp: 0, atk: 0, luk: 0 };

  const isAllZero =
    save.permanentStats.hpLevel === 0 &&
    save.permanentStats.atkLevel === 0 &&
    save.permanentStats.lukLevel === 0;

  const ownedWeapons = getOwnedWeaponEntries(save);
  const isAnyPending = actions.isMutating || isSessionPending;

  return (
    <div className="flex flex-col gap-4">
      <StatSummaryGrid
        hp={totalStats.hp}
        atk={totalStats.atk}
        luk={totalStats.luk}
        title="総合基礎ステータス"
        subtitle={charMaster ? `装備中: ${charMaster.name}` : undefined}
      />

      <Tabs.Root
        value={actions.activeTab}
        onValueChange={(value) => {
          if (!isAnyPending) {
            actions.setActiveTab(value as EnhanceTab);
          }
        }}
      >
        <Tabs.List aria-label="強化対象切替">
          <Tabs.Trigger value="stat" disabled={isAnyPending}>
            基礎強化
          </Tabs.Trigger>
          <Tabs.Trigger value="weapon" disabled={isAnyPending}>
            武器強化
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="stat" className="flex flex-col gap-3">
          {isAllZero && (
            <Text size="caption" tone="muted" className="px-1">
              水晶の勾玉を捧げて基礎能力を底上げしましょう。
            </Text>
          )}
          <div className="flex flex-col gap-3">
            {ENHANCE_STAT_CONFIGS.map((config) => (
              <EnhanceStatCard
                key={config.statKey}
                config={config}
                currentLevel={save.permanentStats[config.statKey]}
                magatamaBalance={save.currencies.magatama}
                enhancingStatKey={actions.enhancingStatKey}
                isAnyPending={isAnyPending}
                onEnhance={(statKey) => {
                  void actions.handleEnhance(statKey);
                }}
              />
            ))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="weapon" className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            {ownedWeapons.map((entry) => (
              <EnhanceWeaponCard
                key={entry.master.id}
                entry={entry}
                isEquipped={false}
                magatamaBalance={save.currencies.magatama}
                refiningWeaponId={actions.refiningWeaponId}
                isAnyPending={isAnyPending}
                onRefine={(weaponId) => {
                  void actions.handleRefineWeapon(weaponId);
                }}
              />
            ))}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};
