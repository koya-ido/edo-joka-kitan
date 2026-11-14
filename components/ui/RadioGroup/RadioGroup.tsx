import { cn } from "@/components/ui/cn";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { ComponentProps, Ref } from "react";

interface RootProps extends ComponentProps<typeof RadioGroupPrimitive.Root> {
  ref?: Ref<HTMLDivElement>;
}

interface ItemProps extends ComponentProps<typeof RadioGroupPrimitive.Item> {
  ref?: Ref<HTMLButtonElement>;
}

interface IndicatorProps
  extends ComponentProps<typeof RadioGroupPrimitive.Indicator> {
  ref?: Ref<HTMLSpanElement>;
}

const RadioGroupRoot = ({ className, ref, ...rest }: RootProps) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("flex flex-col gap-2", className)}
    {...rest}
  />
);

const RadioGroupItem = ({ className, ref, ...rest }: ItemProps) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "game-panel min-h-11 touch-manipulation rounded-lg border-2 border-border bg-card text-left text-card-foreground transition-colors",
      "hover:border-primary/60",
      "data-[state=checked]:border-primary data-[state=checked]:bg-accent/15",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-70",
      className,
    )}
    {...rest}
  />
);

const RadioGroupIndicator = ({ className, ref, ...rest }: IndicatorProps) => (
  <RadioGroupPrimitive.Indicator
    ref={ref}
    className={cn(
      "inline-flex h-3 w-3 items-center justify-center rounded-full bg-primary",
      className,
    )}
    {...rest}
  />
);

export const RadioGroup = {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
  Indicator: RadioGroupIndicator,
};
