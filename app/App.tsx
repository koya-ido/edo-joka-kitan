import { BattlePlaceholderCard } from "@/app/BattlePlaceholderCard";
import { appEnv } from "@/app/env";
import { useHashRouter } from "@/app/router";
import { PlayerSessionProvider, usePlayerSession } from "@/app/session";
import { AppShell } from "@/components/shared/AppShell";
import { AppToastProvider, useAppToast } from "@/components/shared/AppToastProvider";
import { StateView } from "@/components/shared/StateView";
import { Tooltip } from "@/components/ui/Tooltip";
import { guardProtectedRouteAccess } from "@/domain";
import { EnhanceScreen, useEnhanceActions } from "@/features/enhance";
import { FormationScreen, useFormationActions } from "@/features/formation";
import { GachaScreen, useGachaActions } from "@/features/gacha";
import { HomeHeaderActions, HomeScreen, useHomeActions } from "@/features/home";
import { StageSelectScreen } from "@/features/stage-select";
import { useEffect } from "react";

const ROUTE_TITLES: Readonly<Record<string, string>> = {
  "/": appEnv.VITE_APP_TITLE,
  "/stages": "出撃ステージ選択",
  "/gacha": "召喚（ガチャ）",
  "/enhance": "社（永続強化）",
  "/formation": "出撃編成",
};

const AppShellContent = () => {
  const { route, navigate } = useHashRouter();
  const { showErrorToast, showSuccessToast } = useAppToast();
  const {
    status,
    save,
    error,
    isPending,
    reloadSession,
    resetSessionToInitial,
  } = usePlayerSession();

  const isHomeRoute = route.path === "/";
  const isStagesRoute = route.path === "/stages";
  const isEnhanceRoute = route.path === "/enhance";
  const isGachaRoute = route.path === "/gacha";
  const isFormationRoute = route.path === "/formation";
  const isBattleRoute = route.battleStageId !== undefined;
  const homeActions = useHomeActions(isHomeRoute);
  const enhanceActions = useEnhanceActions();
  const gachaActions = useGachaActions();
  const formationActions = useFormationActions();

  useEffect(() => {
    if (!route.battleStageId) {
      return;
    }
    if (status === "error") {
      navigate("/", true);
      return;
    }
    if (status !== "success" || !save) {
      return;
    }
    const guardResult = guardProtectedRouteAccess(save, route.battleStageId);
    if (!guardResult.ok) {
      showErrorToast(guardResult.error);
      navigate("/stages", true);
    }
  }, [status, save, route.battleStageId, showErrorToast, navigate]);

  const canEnterBattle = Boolean(
    isBattleRoute &&
    save &&
    route.battleStageId &&
    guardProtectedRouteAccess(save, route.battleStageId).ok,
  );

  const title = isBattleRoute
    ? `穢土浄化戦 (${route.battleStageId})`
    : (ROUTE_TITLES[route.path] ?? appEnv.VITE_APP_TITLE);

  const handleReset = async () => {
    const res = await resetSessionToInitial();
    if (res.ok) {
      showSuccessToast("セーブデータを初期化しました");
    } else {
      showErrorToast(res.error);
    }
  };

  const isLocked =
    status !== "success" ||
    isPending ||
    homeActions.isMutating ||
    enhanceActions.isMutating ||
    gachaActions.isMutating ||
    formationActions.isMutating;

  const backTarget =
    isFormationRoute && route.from === "stages" ? "/stages" : "/";

  return (
    <AppShell
      title={title}
      currentPath={route.path}
      onNavigate={(to) => {
        navigate(to);
      }}
      currencies={save?.currencies}
      onBack={
        !isHomeRoute
          ? () => {
            navigate(backTarget);
          }
          : undefined
      }
      headerActions={
        isHomeRoute ? (
          <HomeHeaderActions
            hasUnclaimedLoginBonus={homeActions.canClaimLoginBonus}
            disabled={isLocked}
            onOpenLoginBonus={() => {
              homeActions.setLoginBonusOpen(true);
            }}
            onOpenResetDialog={() => {
              homeActions.setResetDialogOpen(true);
            }}
          />
        ) : undefined
      }
      hideBottomNav={isBattleRoute}
      isNavigationDisabled={isLocked}
    >
      <StateView
        status={status}
        error={error}
        isPending={isPending}
        onRetry={reloadSession}
        onResetSave={handleReset}
      >
        {isHomeRoute && save ? (
          <HomeScreen
            save={save}
            actions={homeActions}
            onNavigate={(to) => {
              navigate(to);
            }}
          />
        ) : isStagesRoute && save ? (
          <StageSelectScreen
            save={save}
            isSessionPending={isPending}
            onNavigate={(to) => {
              navigate(to);
            }}
          />
        ) : isEnhanceRoute && save ? (
          <EnhanceScreen
            save={save}
            actions={enhanceActions}
            isSessionPending={isPending}
          />
        ) : isGachaRoute && save ? (
          <GachaScreen
            save={save}
            actions={gachaActions}
            isSessionPending={isPending}
          />
        ) : isFormationRoute && save ? (
          <FormationScreen
            save={save}
            actions={formationActions}
            isSessionPending={isPending}
            onNavigate={(to) => {
              navigate(to);
            }}
          />
        ) : canEnterBattle ? (
          <BattlePlaceholderCard
            title={title}
            equippedCharacterId={save?.equippedCharacterId}
            equippedWeaponId={save?.equippedWeaponId}
            onBackToStages={() => {
              navigate("/stages");
            }}
          />
        ) : null}
      </StateView>
    </AppShell>
  );
};

export const App = () => (
  <Tooltip.Provider>
    <AppToastProvider>
      <PlayerSessionProvider>
        <AppShellContent />
      </PlayerSessionProvider>
    </AppToastProvider>
  </Tooltip.Provider>
);
