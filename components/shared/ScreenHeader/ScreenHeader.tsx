import { CurrencyPill } from "@/components/shared/CurrencyPill";
import { Heading } from "@/components/ui/Typography";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import type { CurrencyBalances } from "@/types";
import { Flame } from "lucide-react";
import type { ReactNode } from "react";

export interface ScreenHeaderProps {
  title: string;
  currencies?: CurrencyBalances | null;
  isHome?: boolean;
  actions?: ReactNode;
}

export const ScreenHeader = ({
  title,
  currencies,
  isHome = false,
  actions,
}: ScreenHeaderProps) => (
  <header className="game-urushi-bar sticky top-0 z-20 border-b-2 border-accent/45 pt-[env(safe-area-inset-top)] shadow-md">
    <div className="flex min-h-14 items-center justify-between gap-2 px-3 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        {isHome ? (
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-accent/60 bg-primary/85 text-primary-foreground shadow-xs"
            >
              <Flame className="h-4 w-4" />
            </span>
            <span className="font-display text-sm font-bold tracking-wider text-accent">
              本陣
            </span>
            <VisuallyHidden>
              <Heading as="h1">{title}</Heading>
            </VisuallyHidden>
          </div>
        ) : (
          <Heading as="h1" className="truncate text-base leading-6 text-battle-foreground sm:text-lg">
            {title}
          </Heading>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {currencies && (
          <>
            <CurrencyPill type="magatama" amount={currencies.magatama} />
            <CurrencyPill type="hisui" amount={currencies.hisui} />
          </>
        )}
        {actions}
      </div>
    </div>
  </header>
);
