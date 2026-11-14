import { StatSummaryGrid } from "@/components/shared/StatSummaryGrid";
import { Text } from "@/components/ui/Typography";
import { CHARACTER_MASTER_MAP, ENHANCE_STAT_CONFIGS } from "@/data";
import { calculateTotalMetaStats } from "@/domain";
import { EnhanceStatCard } from "@/features/enhance/components/EnhanceStatCard";
import type { EnhanceActionsState } from "@/features/enhance/hooks/useEnhanceActions";
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

  const ownedChar = Object.hasOwn(save.ownedCharacters, save.equippedCharacterId)
    ? save.ownedCharacters[save.equippedCharacterId]
    : undefined;

  const totalStats = charMaster
    ? calculateTotalMetaStats(save, charMaster)
    : { hp: 0, atk: 0, luk: 0 };

  const isAllZero =
    save.permanentStats.hpLevel === 0 &&
    save.permanentStats.atkLevel === 0 &&
    save.permanentStats.lukLevel === 0;

  const isAnyPending = actions.isMutating || isSessionPending;

  return (
    <div className="flex flex-col gap-4">
      <StatSummaryGrid
        hp={totalStats.hp}
        atk={totalStats.atk}
        luk={totalStats.luk}
        title="総合基礎ステータス"
        subtitle={
          charMaster
            ? `装備中: ${charMaster.name}（覚醒Lv.${String(ownedChar?.awakeningLevel ?? 0)}）＋ 永続強化`
            : undefined
        }
      />

      {isAllZero && (
        <Text size="caption" tone="muted" className="px-1">
          現在はすべて未強化（Lv.0）です。水晶の勾玉を捧げて基礎能力を底上げしましょう。
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
    </div>
  );
};
