import { cn } from "@/components/ui/cn";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentProps, Ref } from "react";

interface ListProps extends ComponentProps<typeof TabsPrimitive.List> {
  ref?: Ref<HTMLDivElement>;
}

interface TriggerProps extends ComponentProps<typeof TabsPrimitive.Trigger> {
  ref?: Ref<HTMLButtonElement>;
}

interface ContentProps extends ComponentProps<typeof TabsPrimitive.Content> {
  ref?: Ref<HTMLDivElement>;
}

const TabsList = ({ className, ref, ...rest }: ListProps) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex w-full items-center gap-1 rounded-md border border-border bg-secondary/80 p-1",
      className,
    )}
    {...rest}
  />
);

const TabsTrigger = ({ className, ref, ...rest }: TriggerProps) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex min-h-11 flex-1 touch-manipulation items-center justify-center rounded-sm border border-transparent px-3 py-2 text-sm font-semibold text-secondary-foreground transition-colors",
      "hover:text-foreground",
      "data-[state=active]:border-accent/60 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...rest}
  />
);

const TabsContent = ({ className, ref, ...rest }: ContentProps) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-3 focus-visible:outline-none", className)}
    {...rest}
  />
);

export const Tabs = {
  Root: TabsPrimitive.Root,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
};
