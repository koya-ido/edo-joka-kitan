import { cn } from "@/components/ui/cn";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import type { ComponentProps, Ref } from "react";

export interface ToggleProps
  extends ComponentProps<typeof TogglePrimitive.Root> {
  ref?: Ref<HTMLButtonElement>;
}

export const Toggle = ({ className, ref, ...rest }: ToggleProps) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(
      "inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md border border-border px-3 text-sm font-semibold tabular-nums transition-colors",
      "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      "data-[state=on]:border-accent-edge data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      "disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...rest}
  />
);
