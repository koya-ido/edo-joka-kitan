import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/cn";
import { Sparkles, Swords } from "lucide-react";

export type ItemAvatarKind = "character" | "weapon";
export type ItemAvatarSize = "sm" | "md" | "lg";

export interface ItemAvatarProps {
  name: string;
  kind: ItemAvatarKind;
  badgeLabel?: string;
  size?: ItemAvatarSize;
  className?: string;
}

const SIZE_CLASSES: Readonly<Record<ItemAvatarSize, string>> = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

const ICON_CLASSES: Readonly<Record<ItemAvatarSize, string>> = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export const ItemAvatar = ({
  name,
  kind,
  badgeLabel,
  size = "md",
  className,
}: ItemAvatarProps) => {
  const Icon = kind === "character" ? Sparkles : Swords;

  return (
    <div className={cn("relative inline-flex shrink-0 flex-col items-center", className)}>
      <Avatar.Root
        aria-label={name}
        className={cn(
          SIZE_CLASSES[size],
          kind === "character" ? "border-primary/40 bg-primary/10" : "border-accent/50 bg-accent/15",
        )}
      >
        <Avatar.Fallback className="bg-transparent">
          <Icon
            className={cn(
              ICON_CLASSES[size],
              kind === "character" ? "text-primary" : "text-accent-foreground",
            )}
            aria-hidden="true"
          />
        </Avatar.Fallback>
      </Avatar.Root>
      {badgeLabel && (
        <Badge
          variant={kind === "character" ? "default" : "accent"}
          className="-mt-2 z-10 shadow-xs"
        >
          {badgeLabel}
        </Badge>
      )}
    </div>
  );
};
