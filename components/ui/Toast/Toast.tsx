import { cn } from "@/components/ui/cn";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import type { ComponentProps, Ref } from "react";

export type ToastVariant = "default" | "destructive" | "success";

interface ViewportProps extends ComponentProps<typeof ToastPrimitive.Viewport> {
  ref?: Ref<HTMLOListElement>;
}
interface RootProps extends ComponentProps<typeof ToastPrimitive.Root> {
  variant?: ToastVariant;
  ref?: Ref<HTMLLIElement>;
}
interface TitleProps extends ComponentProps<typeof ToastPrimitive.Title> {
  ref?: Ref<HTMLDivElement>;
}
interface DescriptionProps extends ComponentProps<typeof ToastPrimitive.Description> {
  ref?: Ref<HTMLDivElement>;
}
interface CloseProps extends ComponentProps<typeof ToastPrimitive.Close> {
  ref?: Ref<HTMLButtonElement>;
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  default: "border-border bg-popover text-popover-foreground",
  destructive: "border-destructive bg-destructive text-destructive-foreground",
  success: "border-success bg-success text-success-foreground",
};

const ToastViewport = ({ className, ref, ...rest }: ViewportProps) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed top-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 flex-col gap-2 outline-none",
      className,
    )}
    {...rest}
  />
);

const ToastRoot = ({
  variant = "default",
  className,
  children,
  ref,
  ...rest
}: RootProps) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      "flex items-start justify-between gap-3 rounded-md border p-4 shadow-md",
      VARIANT_CLASSES[variant],
      className,
    )}
    {...rest}
  >
    {children}
  </ToastPrimitive.Root>
);

const ToastTitle = ({ className, ref, ...rest }: TitleProps) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-5", className)}
    {...rest}
  />
);

const ToastDescription = ({ className, ref, ...rest }: DescriptionProps) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn("mt-1 text-xs leading-4 opacity-90", className)}
    {...rest}
  />
);

const ToastClose = ({ className, ref, ...rest }: CloseProps) => (
  <ToastPrimitive.Close
    ref={ref}
    aria-label="通知を閉じる"
    className={cn(
      "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md opacity-80 hover:opacity-100",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      className,
    )}
    {...rest}
  >
    <X className="h-4 w-4" aria-hidden="true" />
  </ToastPrimitive.Close>
);

export const Toast = {
  Provider: ToastPrimitive.Provider,
  Viewport: ToastViewport,
  Root: ToastRoot,
  Title: ToastTitle,
  Description: ToastDescription,
  Close: ToastClose,
};
