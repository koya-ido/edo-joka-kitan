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
  onBack?: () => void;
  headerActions?: ReactNode;
  hideBottomNav?: boolean;
  isNavigationDisabled?: boolean;
  children: ReactNode;
}

export const AppShell = ({
  title,
  currentPath,
  onNavigate,
  currencies,
  onBack,
  headerActions,
  hideBottomNav = false,
  isNavigationDisabled = false,
  children,
}: AppShellProps) => (
  <div className="min-h-dvh w-full bg-frame-outer md:flex md:justify-center">
    <div
      className={cn(
        "flex min-h-dvh w-full flex-col bg-background text-foreground",
        "md:max-w-[450px] md:border-x md:border-border md:shadow-xl",
      )}
    >
      <ScreenHeader
        title={title}
        currencies={currencies}
        onBack={onBack}
        disabled={isNavigationDisabled}
        actions={headerActions}
      />
      <main className="flex-1 px-4 py-4">{children}</main>
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
