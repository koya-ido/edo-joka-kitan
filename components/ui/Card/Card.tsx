import { cn } from "@/components/ui/cn";
import type { HTMLAttributes, ReactNode, Ref } from "react";

interface CardSlotProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  ref?: Ref<HTMLHeadingElement>;
}

const CardRoot = ({ className, children, ref, ...rest }: CardSlotProps) => (
  <section
    ref={ref}
    className={cn(
      "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
      className,
    )}
    {...rest}
  >
    {children}
  </section>
);

const CardHeader = ({ className, children, ref, ...rest }: CardSlotProps) => (
  <div ref={ref} className={cn("flex flex-col gap-1 p-4 pb-2", className)} {...rest}>
    {children}
  </div>
);

const CardTitle = ({ className, children, ref, ...rest }: CardTitleProps) => (
  <h3 ref={ref} className={cn("text-lg font-semibold leading-6", className)} {...rest}>
    {children}
  </h3>
);

const CardContent = ({ className, children, ref, ...rest }: CardSlotProps) => (
  <div ref={ref} className={cn("p-4 pt-2", className)} {...rest}>
    {children}
  </div>
);

const CardFooter = ({ className, children, ref, ...rest }: CardSlotProps) => (
  <div ref={ref} className={cn("flex items-center gap-2 p-4 pt-0", className)} {...rest}>
    {children}
  </div>
);

export const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Title: CardTitle,
  Content: CardContent,
  Footer: CardFooter,
};
