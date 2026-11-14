import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Heading, Text } from "@/components/ui/Typography";
import { Sparkles } from "lucide-react";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onSkip: () => void;
}

export const GachaSummonAnimationOverlay = ({ open, onSkip }: Props) => {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="召喚演出中"
      className="fixed inset-0 z-50 bg-frame-outer/90 backdrop-blur-xs"
    >
      <Button
        type="button"
        variant="ghost"
        aria-label="スキップ"
        onClick={onSkip}
        className="h-full w-full cursor-pointer flex-col gap-4 rounded-none p-6 text-battle-foreground hover:bg-transparent"
      >
        <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-full border-2 border-accent bg-battle-surface shadow-2xl">
          <Sparkles className="h-10 w-10 text-accent" aria-hidden="true" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
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
      </Button>
    </div>
  );
};
