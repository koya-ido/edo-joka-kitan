import { BottomTabNav } from "@/components/shared/BottomTabNav";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { cn } from "@/components/ui/cn";
import type { CurrencyBalances } from "@/types";
import type { ReactNode } from "react";

export interface AppShellProps {
  title: string;
  currentPath: string;
  onNavigate: (path: string) => void;
  currencies?: CurrencyBalances | null;
  headerActions?: ReactNode;
  hideHeader?: boolean;
  hideBottomNav?: boolean;
  fullBleed?: boolean;
  isNavigationDisabled?: boolean;
  children: ReactNode;
}

export const AppShell = ({
  title,
  currentPath,
  onNavigate,
  currencies,
  headerActions,
  hideHeader = false,
  hideBottomNav = false,
  fullBleed = false,
  isNavigationDisabled = false,
  children,
}: AppShellProps) => (
  <div className="min-h-dvh w-full bg-frame-outer md:flex md:justify-center">
    <div
      className={cn(
        "game-washi-canvas relative flex min-h-dvh w-full flex-col text-foreground",
        "md:max-w-[450px] md:border-x-2 md:border-accent/35 md:shadow-2xl",
      )}
    >
      {!hideHeader && (
        <ScreenHeader
          title={title}
          currencies={currencies}
          isHome={currentPath === "/"}
          actions={headerActions}
        />
      )}
      <main className={cn("flex flex-1 flex-col", fullBleed ? "p-0" : "px-3.5 py-3")}>
        {children}
      </main>
      {!hideBottomNav && (
        <BottomTabNav
          currentPath={currentPath}
          onNavigate={onNavigate}
          disabled={isNavigationDisabled}
        />
      )}
    </div>
  </div>
);
