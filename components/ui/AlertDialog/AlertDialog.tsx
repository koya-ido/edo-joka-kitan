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
        "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[400px] -translate-x-1/2 -translate-y-1/2 overflow-hidden",
        "game-washi-canvas rounded-lg border-2 border-accent/65 p-5 pt-6 text-popover-foreground shadow-2xl",
        "ring-1 ring-inset ring-accent/30 focus-visible:outline-none",
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className="game-urushi-bar pointer-events-none absolute inset-x-0 top-0 h-2 border-b border-accent/60"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-3 left-2 h-2.5 w-2.5 border-t-2 border-l-2 border-accent/70"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-3 right-2 h-2.5 w-2.5 border-t-2 border-r-2 border-accent/70"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 border-b-2 border-l-2 border-accent/70"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2 bottom-2 h-2.5 w-2.5 border-r-2 border-b-2 border-accent/70"
      />
      {children}
    </AlertDialogPrimitive.Content>
  </AlertDialogPrimitive.Portal>
);

const AlertDialogTitle = ({ className, ref, ...rest }: TitleProps) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn(
      "border-b border-accent/35 pb-2 font-display text-lg font-bold leading-7 text-foreground",
      className,
    )}
    {...rest}
  />
);

const AlertDialogDescription = ({ className, ref, ...rest }: DescriptionProps) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("mt-3 text-sm leading-6 text-muted-foreground", className)}
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
