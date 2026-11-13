import { cn } from "@/components/ui/cn";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import type { ComponentProps, Ref } from "react";

interface RootProps extends ComponentProps<typeof AvatarPrimitive.Root> {
  ref?: Ref<HTMLSpanElement>;
}

interface ImageProps extends ComponentProps<typeof AvatarPrimitive.Image> {
  ref?: Ref<HTMLImageElement>;
}

interface FallbackProps extends ComponentProps<typeof AvatarPrimitive.Fallback> {
  ref?: Ref<HTMLSpanElement>;
}

const AvatarRoot = ({ className, ref, ...rest }: RootProps) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex shrink-0 overflow-hidden rounded-full border border-border bg-secondary",
      className,
    )}
    {...rest}
  />
);

const AvatarImage = ({ className, ref, ...rest }: ImageProps) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...rest}
  />
);

const AvatarFallback = ({ className, ref, ...rest }: FallbackProps) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-secondary font-display font-bold text-secondary-foreground",
      className,
    )}
    {...rest}
  />
);

export const Avatar = {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
};
