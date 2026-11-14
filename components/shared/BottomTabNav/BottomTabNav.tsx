import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { Flame, Shield, Sparkles, Swords } from "lucide-react";

export type AppTabPath = "/stages" | "/gacha" | "/enhance" | "/formation";

export interface BottomTabNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  disabled?: boolean;
}

const TAB_ITEMS: readonly {
  readonly path: AppTabPath;
  readonly label: string;
  readonly Icon: typeof Swords;
}[] = [
    { path: "/stages", label: "出撃", Icon: Swords },
    { path: "/gacha", label: "ガチャ", Icon: Sparkles },
    { path: "/enhance", label: "社", Icon: Flame },
    { path: "/formation", label: "編成", Icon: Shield },
  ];

export const BottomTabNav = ({
  currentPath,
  onNavigate,
  disabled = false,
}: BottomTabNavProps) => (
  <nav
    aria-label="メインナビゲーション"
    className="game-urushi-bar sticky bottom-0 z-20 grid grid-cols-4 gap-1.5 border-t-2 border-accent/45 px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-lg"
  >
    {TAB_ITEMS.map(({ path, label, Icon }) => {
      const isActive = currentPath === path;
      return (
        <Button
          key={path}
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-current={isActive ? "page" : undefined}
          onClick={() => {
            onNavigate(path);
          }}
          className={cn(
            "flex h-auto min-h-12 flex-col gap-0.5 rounded-md border px-1 py-1.5 transition-all",
            isActive
              ? "game-btn-primary border-accent/60 bg-primary text-primary-foreground"
              : "border-battle-foreground/10 bg-battle-foreground/5 text-battle-foreground/75 hover:border-accent/40 hover:bg-battle-foreground/10 hover:text-battle-foreground",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="font-display text-xs font-bold leading-4 tracking-wider">
            {label}
          </span>
        </Button>
      );
    })}
  </nav>
);
