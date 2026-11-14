import { usePlayerSession } from "@/app/session";
import { useAppToast } from "@/components/shared/AppToastProvider";
import {
  ENHANCE_STAT_CONFIG_MAP,
  WEAPON_MASTER_MAP,
  type EnhanceStatKey,
} from "@/data";
import { enhancePermanentStat, enhanceWeaponRefine } from "@/storage";
import type { WeaponId } from "@/types";
import { useCallback, useState } from "react";

export type EnhanceTab = "stat" | "weapon";

export interface EnhanceActionsState {
  readonly activeTab: EnhanceTab;
  readonly enhancingStatKey: EnhanceStatKey | null;
  readonly refiningWeaponId: WeaponId | null;
  readonly isMutating: boolean;
  readonly setActiveTab: (tab: EnhanceTab) => void;
  readonly handleEnhance: (statKey: EnhanceStatKey) => Promise<void>;
  readonly handleRefineWeapon: (weaponId: WeaponId) => Promise<void>;
}

export const useEnhanceActions = (): EnhanceActionsState => {
  const { isPending, applyCommittedSave } = usePlayerSession();
  const { showErrorToast, showSuccessToast } = useAppToast();
  const [activeTab, setActiveTab] = useState<EnhanceTab>("stat");
  const [enhancingStatKey, setEnhancingStatKey] =
    useState<EnhanceStatKey | null>(null);
  const [refiningWeaponId, setRefiningWeaponId] = useState<WeaponId | null>(
    null,
  );

  const isMutating = enhancingStatKey !== null || refiningWeaponId !== null;

  const handleEnhance = useCallback(
    async (statKey: EnhanceStatKey) => {
      if (isMutating || isPending) {
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
      isMutating,
      isPending,
      applyCommittedSave,
      showSuccessToast,
      showErrorToast,
    ],
  );

  const handleRefineWeapon = useCallback(
    async (weaponId: WeaponId) => {
      if (isMutating || isPending) {
        return;
      }
      setRefiningWeaponId(weaponId);
      try {
        const res = await enhanceWeaponRefine(weaponId);
        if (res.ok) {
          applyCommittedSave(res.data);
          const weaponName = WEAPON_MASTER_MAP[weaponId].name;
          const nextLv = res.data.ownedWeapons[weaponId].refineLevel;
          showSuccessToast(
            `${weaponName}を 精錬Lv.${String(nextLv)} に強化しました`,
          );
        } else {
          showErrorToast(res.error);
        }
      } finally {
        setRefiningWeaponId(null);
      }
    },
    [
      isMutating,
      isPending,
      applyCommittedSave,
      showSuccessToast,
      showErrorToast,
    ],
  );

  return {
    activeTab,
    enhancingStatKey,
    refiningWeaponId,
    isMutating,
    setActiveTab,
    handleEnhance,
    handleRefineWeapon,
  };
};
