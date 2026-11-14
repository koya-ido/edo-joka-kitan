import { cn } from "@/components/ui/cn";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentProps, Ref } from "react";

interface ContentProps extends ComponentProps<typeof PopoverPrimitive.Content> {
  ref?: Ref<HTMLDivElement>;
}

const PopoverContent = ({
  className,
  align = "center",
  sideOffset = 6,
  children,
  ref,
  ...rest
}: ContentProps) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-30 w-72 rounded-md border border-border bg-popover p-3 text-sm text-popover-foreground shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...rest}
    >
      {children}
      <PopoverPrimitive.Arrow className="fill-popover" />
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
);

export const Popover = {
  Root: PopoverPrimitive.Root,
  Trigger: PopoverPrimitive.Trigger,
  Content: PopoverContent,
  Arrow: PopoverPrimitive.Arrow,
};
