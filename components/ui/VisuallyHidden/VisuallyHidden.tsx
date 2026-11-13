import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden";
import type { ComponentProps } from "react";

export type VisuallyHiddenProps = ComponentProps<typeof VisuallyHiddenPrimitive.Root>;

export const VisuallyHidden = ({ children, ...rest }: VisuallyHiddenProps) => (
  <VisuallyHiddenPrimitive.Root {...rest}>{children}</VisuallyHiddenPrimitive.Root>
);
