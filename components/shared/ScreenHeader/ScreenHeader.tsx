import { CurrencyPill } from "@/components/shared/CurrencyPill";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { Heading } from "@/components/ui/Typography";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import type { CurrencyBalances } from "@/types";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export interface ScreenHeaderProps {
  title: string;
  currencies?: CurrencyBalances | null;
  onBack?: () => void;
  backLabel?: string;
  disabled?: boolean;
  actions?: ReactNode;
}

export const ScreenHeader = ({
  title,
  currencies,
  onBack,
  backLabel = "戻る",
  disabled = false,
  actions,
}: ScreenHeaderProps) => (
  <header className="sticky top-0 z-20 bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-xs">
    <div className="flex min-h-14 items-center justify-between gap-2 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={onBack}
            aria-label={backLabel}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <VisuallyHidden>{backLabel}</VisuallyHidden>
          </Button>
        )}
        <Heading as="h1" className="truncate text-lg leading-6 sm:text-xl">
          {title}
        </Heading>
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
    <Separator />
  </header>
);
