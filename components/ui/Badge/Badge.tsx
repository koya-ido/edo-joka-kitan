import { cn } from "@/components/ui/cn";
import type { HTMLAttributes, ReactNode, Ref } from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "muted"
  | "accent";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
  ref?: Ref<HTMLSpanElement>;
}

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-secondary text-secondary-foreground border-border",
  success: "bg-success text-success-foreground border-transparent",
  warning: "bg-warning text-warning-foreground border-transparent",
  destructive: "bg-destructive text-destructive-foreground border-transparent",
  muted: "bg-muted text-muted-foreground border-border",
  accent: "bg-accent text-accent-foreground border-transparent",
};

export const Badge = ({
  variant = "default",
  className,
  children,
  ref,
  ...rest
}: BadgeProps) => (
  <span
    ref={ref}
    className={cn(
      "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium leading-4",
      BADGE_CLASSES[variant],
      className,
    )}
    {...rest}
  >
    {children}
  </span>
);
