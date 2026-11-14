import { RadioGroup } from "@/components/ui/RadioGroup";
import { Text } from "@/components/ui/Typography";
import { cn } from "@/components/ui/cn";
import type { ReactNode } from "react";

export interface SelectableCardProps {
  value: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: ReactNode;
  leading?: ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * RadioGroup.Root 内で単一選択カードとして機能するアクセシブルな和風選択カード。
 * 最小タッチ領域 44x44px 以上・フォーカスリング・選択中ハイライトを備える。
 */
export const SelectableCard = ({
  value,
  title,
  subtitle,
  description,
  badge,
  leading,
  meta,
  disabled = false,
  className,
}: SelectableCardProps) => (
  <RadioGroup.Item
    value={value}
    disabled={disabled}
    className={cn("w-full p-3", className)}
  >
    <div className="flex items-start gap-3">
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <span
          aria-hidden="true"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-input bg-background"
        >
          <RadioGroup.Indicator />
        </span>
        {leading}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <Text size="label" className="text-foreground">
              {title}
            </Text>
            {subtitle && (
              <Text size="caption" tone="muted">
                {subtitle}
              </Text>
            )}
          </div>
          {badge}
        </div>

        {description && (
          <Text size="caption" tone="muted" className="leading-5">
            {description}
          </Text>
        )}

        {meta && <div className="mt-1 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
    </div>
  </RadioGroup.Item>
);
