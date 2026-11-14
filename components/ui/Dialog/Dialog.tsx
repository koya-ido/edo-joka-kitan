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
        "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[410px] -translate-x-1/2 -translate-y-1/2 overflow-hidden",
        "game-washi-canvas rounded-lg border-2 border-accent/65 p-5 pt-6 text-popover-foreground shadow-2xl",
        "ring-1 ring-inset ring-accent/30 focus-visible:outline-none",
        className,
      )}
      {...rest}
    >
      {/* 上部の漆塗り飾り帯と四隅の隅金具 */}
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
        className="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 border-b-2 border-l-2 border-accent/70"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2 bottom-2 h-2.5 w-2.5 border-r-2 border-b-2 border-accent/70"
      />
      {children}
      {!hideCloseButton && (
        <DialogPrimitive.Close
          disabled={isPending}
          aria-label="閉じる"
          className={cn(
            "absolute top-3.5 right-3 inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border bg-secondary/70",
            "text-foreground transition-colors hover:border-accent/60 hover:bg-secondary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
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
}) => (
  <div className={cn("flex flex-col gap-1.5 border-b border-accent/35 pb-3 pr-10", className)}>
    {children}
  </div>
);

const DialogFooter = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div className={cn("mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}>
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
