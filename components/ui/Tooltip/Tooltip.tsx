import { cn } from "@/components/ui/cn";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentProps, Ref } from "react";

interface ContentProps extends ComponentProps<typeof TooltipPrimitive.Content> {
  ref?: Ref<HTMLDivElement>;
}

const TooltipContent = ({
  sideOffset = 6,
  className,
  children,
  ref,
  ...rest
}: ContentProps) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-30 rounded-md border border-border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-sm",
        className,
      )}
      {...rest}
    >
      {children}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
);

export const Tooltip = {
  Provider: TooltipPrimitive.Provider,
  Root: TooltipPrimitive.Root,
  Trigger: TooltipPrimitive.Trigger,
  Content: TooltipContent,
};
