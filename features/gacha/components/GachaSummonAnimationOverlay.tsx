import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Heading, Text } from "@/components/ui/Typography";
import type { GachaExecutionOutput } from "@/domain";
import { ShrineToriiGateSvg } from "@/features/gacha/components/ShrineToriiGateSvg";
import type { GachaOutcomeType } from "@/types";
import { Sparkles } from "lucide-react";
import { useEffect } from "react";

interface Props {
  open: boolean;
  result?: GachaExecutionOutput | null;
  onSkip: () => void;
}

const resolveTopOutcome = (
  result?: GachaExecutionOutput | null,
): GachaOutcomeType => {
  if (!result) return "converted_to_magatama";
  if (result.items.some((item) => item.outcome === "new")) return "new";
  if (result.items.some((item) => item.outcome === "awakening_or_refine")) {
    return "awakening_or_refine";
  }
  return "converted_to_magatama";
};

const OUTCOME_GATE_STYLES: Readonly<
  Record<
    GachaOutcomeType,
    { readonly auraClass: string; readonly label: string }
  >
> = {
  new: {
    auraClass: "text-accent drop-shadow-2xl",
    label: "新しき霊縁が結ばれる…",
  },
  awakening_or_refine: {
    auraClass: "text-magatama drop-shadow-xl",
    label: "霊力が共鳴する…",
  },
  converted_to_magatama: {
    auraClass: "text-battle-foreground drop-shadow-lg",
    label: "清浄なる霊脈が開く…",
  },
};

export const GachaSummonAnimationOverlay = ({
  open,
  result,
  onSkip,
}: Props) => {
  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onSkip]);

  if (!open) {
    return null;
  }

  const topOutcome = resolveTopOutcome(result);
  const gateStyle = OUTCOME_GATE_STYLES[topOutcome];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="召喚演出中"
      className="fixed inset-0 z-50 bg-frame-outer/95 backdrop-blur-xs"
    >
      <Button
        type="button"
        variant="ghost"
        aria-label="スキップ"
        onClick={onSkip}
        className="relative h-full w-full cursor-pointer flex-col justify-between overflow-hidden rounded-none p-6 text-battle-foreground hover:bg-transparent"
      >
        <div className="relative z-10 flex flex-col items-center gap-1 pt-6 text-center">
          <Badge variant="accent" className="shadow-sm">
            {gateStyle.label}
          </Badge>
        </div>

        <div className="relative flex w-full max-w-[380px] items-center justify-center">
          <ShrineToriiGateSvg auraClass={gateStyle.auraClass} />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Sparkles
              className={`h-10 w-10 animate-pulse ${gateStyle.auraClass}`}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-3 pb-4 text-center">
          <div className="flex flex-col items-center gap-1">
            <Heading as="h2" className="text-battle-foreground">
              霊脈召喚中…
            </Heading>
            <Text size="caption" className="text-battle-foreground/80">
              画面をタップして演出をスキップできます
            </Text>
          </div>
          <Badge
            variant="default"
            className="min-h-11 rounded-md px-4 text-sm font-semibold shadow-sm"
          >
            スキップ
          </Badge>
        </div>
      </Button>
    </div>
  );
};
