import { appEnv } from "@/app/env";
import { useHashRouter } from "@/app/router";
import { PlayerSessionProvider, usePlayerSession } from "@/app/session";
import { AppShell } from "@/components/shared/AppShell";
import { AppToastProvider, useAppToast } from "@/components/shared/AppToastProvider";
import { StateView } from "@/components/shared/StateView";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";
import { Heading, Text } from "@/components/ui/Typography";
import { guardProtectedRouteAccess } from "@/domain";
import { EnhanceScreen, useEnhanceActions } from "@/features/enhance";
import { GachaScreen, useGachaActions } from "@/features/gacha";
import { HomeHeaderActions, HomeScreen, useHomeActions } from "@/features/home";
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
  const isEnhanceRoute = route.path === "/enhance";
  const isGachaRoute = route.path === "/gacha";
  const isBattleRoute = route.battleStageId !== undefined;
  const homeActions = useHomeActions(isHomeRoute);
  const enhanceActions = useEnhanceActions();
  const gachaActions = useGachaActions();

  useEffect(() => {
    if (status !== "success" || !save || !route.battleStageId) {
      return;
    }
    const guardResult = guardProtectedRouteAccess(save, route.battleStageId);
    if (!guardResult.ok) {
      showErrorToast(guardResult.error);
      navigate("/stages", true);
    }
  }, [status, save, route.battleStageId, showErrorToast, navigate]);

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
    gachaActions.isMutating;

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
            navigate("/");
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
        ) : (
          <Card.Root>
            <Card.Header>
              <div className="flex items-center justify-between gap-2">
                <Heading as="h2">{title}</Heading>
                <Badge variant="success">霊脈接続済み</Badge>
              </div>
            </Card.Header>
            <Card.Content className="flex flex-col gap-2">
              <Text>
                装備中主人公:{" "}
                <span className="font-semibold">{save?.equippedCharacterId}</span>
              </Text>
              <Text>
                持ち込み主武器:{" "}
                <span className="font-semibold">{save?.equippedWeaponId}</span>
              </Text>
              <Text size="caption" tone="muted">
                解放済みステージ数: {save?.unlockedStageIds.length ?? 0}
              </Text>
            </Card.Content>
          </Card.Root>
        )}
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
