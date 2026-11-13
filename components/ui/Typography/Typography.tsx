import { cn } from "@/components/ui/cn";
import type { HTMLAttributes, ReactNode, Ref } from "react";

export type HeadingLevel = "h1" | "h2" | "h3" | "h4";

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as: HeadingLevel;
  children: ReactNode;
  ref?: Ref<HTMLHeadingElement>;
}

const HEADING_CLASSES: Record<HeadingLevel, string> = {
  h1: "font-display text-2xl font-bold leading-8 text-foreground",
  h2: "font-display text-xl font-bold leading-7 text-foreground",
  h3: "text-lg font-semibold leading-6 text-foreground",
  h4: "text-base font-semibold leading-6 text-foreground",
};

export const Heading = ({
  as,
  className,
  children,
  ref,
  ...rest
}: HeadingProps) => {
  const Tag = as;
  return (
    <Tag ref={ref} className={cn(HEADING_CLASSES[as], className)} {...rest}>
      {children}
    </Tag>
  );
};

export type TextTone = "default" | "muted" | "destructive" | "success";
export type TextSize = "body" | "label" | "caption";

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: TextTone;
  size?: TextSize;
  tabularNums?: boolean;
  children: ReactNode;
  ref?: Ref<HTMLParagraphElement>;
}

const TONE_CLASSES: Record<TextTone, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  destructive: "text-destructive",
  success: "text-success",
};

const TEXT_SIZE_CLASSES: Record<TextSize, string> = {
  body: "text-sm font-normal leading-6",
  label: "text-sm font-semibold leading-5",
  caption: "text-xs font-medium leading-4",
};

export const Text = ({
  tone = "default",
  size = "body",
  tabularNums = false,
  className,
  children,
  ref,
  ...rest
}: TextProps) => (
  <p
    ref={ref}
    className={cn(
      TEXT_SIZE_CLASSES[size],
      TONE_CLASSES[tone],
      tabularNums && "tabular-nums font-bold",
      className,
    )}
    {...rest}
  >
    {children}
  </p>
);
