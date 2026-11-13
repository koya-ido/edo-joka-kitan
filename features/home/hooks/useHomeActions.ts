import { usePlayerSession } from "@/app/session";
import { useAppToast } from "@/components/shared/AppToastProvider";
import { getLocalDateKey, isLoginBonusClaimable } from "@/domain";
import { claimLoginBonus } from "@/storage";
import { useCallback, useEffect, useRef, useState } from "react";

export interface HomeActionsState {
  readonly isLoginBonusOpen: boolean;
  readonly isResetDialogOpen: boolean;
  readonly canClaimLoginBonus: boolean;
  readonly isMutating: boolean;
  readonly setLoginBonusOpen: (open: boolean) => void;
  readonly setResetDialogOpen: (open: boolean) => void;
  readonly handleClaimLoginBonus: () => Promise<void>;
  readonly handleResetSave: () => Promise<void>;
}

export const useHomeActions = (isActiveRoute: boolean): HomeActionsState => {
  const { status, save, isPending, applyCommittedSave, resetSessionToInitial } =
    usePlayerSession();
  const { showErrorToast, showSuccessToast } = useAppToast();

  const [isLoginBonusOpen, setLoginBonusOpen] = useState(false);
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const hasAutoOpenedRef = useRef(false);

  const todayKey = getLocalDateKey();
  const canClaimLoginBonus =
    save !== null ? isLoginBonusClaimable(save, todayKey) : false;
  const isMutating = isPending || isClaiming;

  useEffect(() => {
    if (!isActiveRoute || status !== "success" || !save) {
      return;
    }
    if (!hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      if (isLoginBonusClaimable(save, getLocalDateKey())) {
        setLoginBonusOpen(true);
      }
    }
  }, [isActiveRoute, status, save]);

  const handleClaimLoginBonus = useCallback(async () => {
    if (isMutating || status !== "success" || !save) {
      return;
    }
    setIsClaiming(true);
    try {
      const result = await claimLoginBonus(new Date());
      if (result.ok) {
        applyCommittedSave(result.data);
        showSuccessToast(
          "ログインボーナスを受け取りました",
          "水晶の勾玉と翡翠を獲得しました。",
        );
        setLoginBonusOpen(false);
        return;
      }
      showErrorToast(result.error);
    } finally {
      setIsClaiming(false);
    }
  }, [
    isMutating,
    status,
    save,
    applyCommittedSave,
    showSuccessToast,
    showErrorToast,
  ]);

  const handleResetSave = useCallback(async () => {
    if (isMutating) {
      return;
    }
    const result = await resetSessionToInitial();
    if (result.ok) {
      setResetDialogOpen(false);
      hasAutoOpenedRef.current = false;
      showSuccessToast("セーブデータを初期化しました");
      return;
    }
    showErrorToast(result.error);
  }, [isMutating, resetSessionToInitial, showSuccessToast, showErrorToast]);

  return {
    isLoginBonusOpen,
    isResetDialogOpen,
    canClaimLoginBonus,
    isMutating,
    setLoginBonusOpen,
    setResetDialogOpen,
    handleClaimLoginBonus,
    handleResetSave,
  };
};
