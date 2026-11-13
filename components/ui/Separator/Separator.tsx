import { cn } from "@/components/ui/cn";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import type { ComponentProps, Ref } from "react";

export interface SeparatorProps
  extends ComponentProps<typeof SeparatorPrimitive.Root> {
  ref?: Ref<HTMLDivElement>;
}

export const Separator = ({
  orientation = "horizontal",
  decorative = true,
  className,
  ref,
  ...rest
}: SeparatorProps) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className,
    )}
    {...rest}
  />
);
