import { usePlayerSession } from "@/app/session";
import { useAppToast } from "@/components/shared/AppToastProvider";
import { ENHANCE_STAT_CONFIG_MAP, type EnhanceStatKey } from "@/data";
import { enhancePermanentStat } from "@/storage";
import { useCallback, useState } from "react";

export interface EnhanceActionsState {
  readonly enhancingStatKey: EnhanceStatKey | null;
  readonly isMutating: boolean;
  readonly handleEnhance: (statKey: EnhanceStatKey) => Promise<void>;
}

export const useEnhanceActions = (): EnhanceActionsState => {
  const { isPending, applyCommittedSave } = usePlayerSession();
  const { showErrorToast, showSuccessToast } = useAppToast();
  const [enhancingStatKey, setEnhancingStatKey] =
    useState<EnhanceStatKey | null>(null);

  const isMutating = enhancingStatKey !== null;

  const handleEnhance = useCallback(
    async (statKey: EnhanceStatKey) => {
      if (enhancingStatKey !== null || isPending) {
        return;
      }
      setEnhancingStatKey(statKey);
      try {
        const res = await enhancePermanentStat(statKey);
        if (res.ok) {
          applyCommittedSave(res.data);
          const config = ENHANCE_STAT_CONFIG_MAP[statKey];
          const nextLv = res.data.permanentStats[statKey];
          showSuccessToast(
            `${config.label}を Lv.${String(nextLv)} に強化しました`,
          );
        } else {
          showErrorToast(res.error);
        }
      } finally {
        setEnhancingStatKey(null);
      }
    },
    [
      enhancingStatKey,
      isPending,
      applyCommittedSave,
      showSuccessToast,
      showErrorToast,
    ],
  );

  return {
    enhancingStatKey,
    isMutating,
    handleEnhance,
  };
};
