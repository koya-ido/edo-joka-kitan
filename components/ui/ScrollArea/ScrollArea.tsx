import { cn } from "@/components/ui/cn";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import type { ComponentProps, Ref } from "react";

interface RootProps extends ComponentProps<typeof ScrollAreaPrimitive.Root> {
  ref?: Ref<HTMLDivElement>;
}
interface ViewportProps extends ComponentProps<typeof ScrollAreaPrimitive.Viewport> {
  ref?: Ref<HTMLDivElement>;
}
interface ScrollbarProps
  extends ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
  ref?: Ref<HTMLDivElement>;
}
interface ThumbProps extends ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaThumb> {
  ref?: Ref<HTMLDivElement>;
}

const ScrollAreaRoot = ({ className, children, ref, ...rest }: RootProps) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...rest}
  >
    {children}
  </ScrollAreaPrimitive.Root>
);

const ScrollAreaViewport = ({ className, children, ref, ...rest }: ViewportProps) => (
  <ScrollAreaPrimitive.Viewport
    ref={ref}
    className={cn("h-full w-full rounded-[inherit]", className)}
    {...rest}
  >
    {children}
  </ScrollAreaPrimitive.Viewport>
);

const ScrollAreaScrollbar = ({
  orientation = "vertical",
  className,
  ref,
  ...rest
}: ScrollbarProps) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2 border-l border-l-transparent p-px",
      orientation === "horizontal" && "h-2 flex-col border-t border-t-transparent p-px",
      className,
    )}
    {...rest}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
);

const ScrollAreaThumb = ({ className, ref, ...rest }: ThumbProps) => (
  <ScrollAreaPrimitive.ScrollAreaThumb
    ref={ref}
    className={cn("relative flex-1 rounded-full bg-border", className)}
    {...rest}
  />
);

export const ScrollArea = {
  Root: ScrollAreaRoot,
  Viewport: ScrollAreaViewport,
  Scrollbar: ScrollAreaScrollbar,
  Thumb: ScrollAreaThumb,
};
