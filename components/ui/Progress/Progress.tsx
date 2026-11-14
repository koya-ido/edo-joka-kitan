import { cn } from "@/components/ui/cn";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import type { ComponentProps, Ref } from "react";

export type ProgressVariant = "barrier" | "exp" | "primary";

interface ProgressRootProps
  extends ComponentProps<typeof ProgressPrimitive.Root> {
  ref?: Ref<HTMLDivElement>;
}

interface ProgressIndicatorProps
  extends ComponentProps<typeof ProgressPrimitive.Indicator> {
  value?: number | null;
  max?: number;
  variant?: ProgressVariant;
  ref?: Ref<HTMLDivElement>;
}

const VARIANT_CLASSES: Readonly<Record<ProgressVariant, string>> = {
  barrier: "bg-barrier",
  exp: "bg-exp",
  primary: "bg-primary",
};

const ProgressRoot = ({ className, ref, ...rest }: ProgressRootProps) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-3 w-full overflow-hidden rounded-sm border border-border/40 bg-muted",
      className,
    )}
    {...rest}
  />
);

const ProgressIndicator = ({
  className,
  value = 0,
  max = 100,
  variant = "primary",
  ref,
  ...rest
}: ProgressIndicatorProps) => {
  const safeMax = max > 0 ? max : 100;
  const safeValue = typeof value === "number" ? Math.max(0, Math.min(safeMax, value)) : 0;
  const pct = (safeValue / safeMax) * 100;

  return (
    <ProgressPrimitive.Indicator
      ref={ref}
      className={cn(
        "h-full w-full flex-1 transition-transform duration-150 ease-out",
        VARIANT_CLASSES[variant],
        className,
      )}
      style={{ transform: `translateX(-${String(100 - pct)}%)` }}
      {...rest}
    />
  );
};

export const Progress = {
  Root: ProgressRoot,
  Indicator: ProgressIndicator,
};
