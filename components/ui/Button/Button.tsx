import { cn } from "@/components/ui/cn";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, Ref } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "ghost"
  | "outline";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isPending?: boolean;
  asChild?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-transparent",
  ghost:
    "bg-transparent text-foreground hover:bg-secondary/60 border border-transparent",
  outline:
    "bg-card text-card-foreground hover:bg-secondary/50 border border-input",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 py-2 text-xs",
  md: "min-h-11 px-4 py-2 text-sm",
  lg: "min-h-12 px-6 py-3 text-base",
  icon: "min-h-11 min-w-11 p-2",
};

export const Button = ({
  variant = "primary",
  size = "md",
  isPending = false,
  asChild = false,
  disabled = false,
  className,
  children,
  type = "button",
  ref,
  ...rest
}: ButtonProps) => {
  const isDisabled = disabled || isPending;
  const baseClassName = cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold leading-5",
    "touch-manipulation select-none transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );

  if (asChild) {
    return (
      <Slot
        ref={ref}
        className={baseClassName}
        aria-disabled={isDisabled || undefined}
        {...rest}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isPending || undefined}
      className={baseClassName}
      {...rest}
    >
      {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
};
