import { cn } from "@/components/ui/cn";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { ComponentProps, Ref } from "react";

interface ContentProps extends ComponentProps<typeof AlertDialogPrimitive.Content> {
  ref?: Ref<HTMLDivElement>;
}
interface TitleProps extends ComponentProps<typeof AlertDialogPrimitive.Title> {
  ref?: Ref<HTMLHeadingElement>;
}
interface DescriptionProps
  extends ComponentProps<typeof AlertDialogPrimitive.Description> {
  ref?: Ref<HTMLParagraphElement>;
}
interface ActionProps extends ComponentProps<typeof AlertDialogPrimitive.Action> {
  ref?: Ref<HTMLButtonElement>;
}
interface CancelProps extends ComponentProps<typeof AlertDialogPrimitive.Cancel> {
  ref?: Ref<HTMLButtonElement>;
}

const AlertDialogContent = ({ className, children, ref, ...rest }: ContentProps) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogPrimitive.Overlay className="fixed inset-0 z-40 bg-frame-outer/75 backdrop-blur-xs" />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[400px] -translate-x-1/2 -translate-y-1/2",
        "rounded-lg border border-border bg-popover p-6 text-popover-foreground shadow-lg",
        "focus-visible:outline-none",
        className,
      )}
      {...rest}
    >
      {children}
    </AlertDialogPrimitive.Content>
  </AlertDialogPrimitive.Portal>
);

const AlertDialogTitle = ({ className, ref, ...rest }: TitleProps) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("font-display text-xl font-bold leading-7 text-foreground", className)}
    {...rest}
  />
);

const AlertDialogDescription = ({ className, ref, ...rest }: DescriptionProps) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("mt-2 text-sm leading-6 text-muted-foreground", className)}
    {...rest}
  />
);

const AlertDialogAction = ({ className, ref, ...rest }: ActionProps) => (
  <AlertDialogPrimitive.Action ref={ref} className={className} {...rest} />
);

const AlertDialogCancel = ({ className, ref, ...rest }: CancelProps) => (
  <AlertDialogPrimitive.Cancel ref={ref} className={className} {...rest} />
);

export const AlertDialog = {
  Root: AlertDialogPrimitive.Root,
  Trigger: AlertDialogPrimitive.Trigger,
  Content: AlertDialogContent,
  Title: AlertDialogTitle,
  Description: AlertDialogDescription,
  Action: AlertDialogAction,
  Cancel: AlertDialogCancel,
};
