import { cn } from "@/components/ui/cn";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode, Ref } from "react";

interface ContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  ref?: Ref<HTMLDivElement>;
  isPending?: boolean;
  hideCloseButton?: boolean;
}

interface TitleProps extends ComponentProps<typeof DialogPrimitive.Title> {
  ref?: Ref<HTMLHeadingElement>;
}

interface DescriptionProps
  extends ComponentProps<typeof DialogPrimitive.Description> {
  ref?: Ref<HTMLParagraphElement>;
}

const DialogContent = ({
  className,
  children,
  isPending = false,
  hideCloseButton = false,
  onEscapeKeyDown,
  onPointerDownOutside,
  ref,
  ...rest
}: ContentProps) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-frame-outer/75 backdrop-blur-xs" />
    <DialogPrimitive.Content
      ref={ref}
      onEscapeKeyDown={(event) => {
        if (isPending) {
          event.preventDefault();
          return;
        }
        onEscapeKeyDown?.(event);
      }}
      onPointerDownOutside={(event) => {
        if (isPending) {
          event.preventDefault();
          return;
        }
        onPointerDownOutside?.(event);
      }}
      className={cn(
        "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[410px] -translate-x-1/2 -translate-y-1/2",
        "rounded-lg border border-border bg-popover p-6 text-popover-foreground shadow-xl",
        "focus-visible:outline-none",
        className,
      )}
      {...rest}
    >
      {children}
      {!hideCloseButton && (
        <DialogPrimitive.Close
          disabled={isPending}
          aria-label="閉じる"
          className={cn(
            "absolute top-3 right-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md",
            "text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

const DialogHeader = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => <div className={cn("flex flex-col gap-1.5 pr-8", className)}>{children}</div>;

const DialogFooter = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}>
    {children}
  </div>
);

const DialogTitle = ({ className, ref, ...rest }: TitleProps) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("font-display text-xl font-bold leading-7 text-foreground", className)}
    {...rest}
  />
);

const DialogDescription = ({ className, ref, ...rest }: DescriptionProps) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-6 text-muted-foreground", className)}
    {...rest}
  />
);

export const Dialog = {
  Root: DialogPrimitive.Root,
  Trigger: DialogPrimitive.Trigger,
  Portal: DialogPrimitive.Portal,
  Close: DialogPrimitive.Close,
  Content: DialogContent,
  Header: DialogHeader,
  Title: DialogTitle,
  Description: DialogDescription,
  Footer: DialogFooter,
};
