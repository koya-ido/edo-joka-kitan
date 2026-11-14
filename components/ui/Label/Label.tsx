import { cn } from "@/components/ui/cn";
import * as LabelPrimitive from "@radix-ui/react-label";
import type { ComponentProps, Ref } from "react";

interface LabelProps extends ComponentProps<typeof LabelPrimitive.Root> {
  ref?: Ref<HTMLLabelElement>;
}

export const Label = ({ className, ref, ...rest }: LabelProps) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("text-sm font-semibold text-foreground", className)}
    {...rest}
  />
);
