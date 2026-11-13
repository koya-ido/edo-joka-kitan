import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";
import type { ComponentProps, Ref } from "react";

interface AspectRatioProps extends ComponentProps<typeof AspectRatioPrimitive.Root> {
  ref?: Ref<HTMLDivElement>;
}

export const AspectRatio = ({ ref, ...rest }: AspectRatioProps) => (
  <AspectRatioPrimitive.Root ref={ref} {...rest} />
);
