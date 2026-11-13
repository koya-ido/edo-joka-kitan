import { HisuiIcon, MagatamaIcon } from "@/components/icons";
import { Text } from "@/components/ui/Typography";
import { cn } from "@/components/ui/cn";
import type { CurrencyType } from "@/types";

export interface CurrencyPillProps {
  type: CurrencyType;
  amount: number;
  requiredAmount?: number;
  className?: string;
}

const CURRENCY_META: Record<
  CurrencyType,
  { readonly label: string; readonly iconClass: string; readonly bgClass: string }
> = {
  magatama: {
    label: "水晶の勾玉",
    iconClass: "text-magatama",
    bgClass: "bg-magatama/10 border-magatama/30",
  },
  hisui: {
    label: "翡翠",
    iconClass: "text-hisui",
    bgClass: "bg-hisui/10 border-hisui/30",
  },
};

export const CurrencyPill = ({
  type,
  amount,
  requiredAmount,
  className,
}: CurrencyPillProps) => {
  const meta = CURRENCY_META[type];
  const isInsufficient = requiredAmount !== undefined && amount < requiredAmount;
  const Icon = type === "magatama" ? MagatamaIcon : HisuiIcon;

  return (
    <div
      aria-label={`${meta.label}: ${String(amount)}`}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1",
        isInsufficient
          ? "border-destructive/50 bg-destructive/10"
          : meta.bgClass,
        className,
      )}
    >
      <Text size="caption" className="sr-only">
        {meta.label}
      </Text>
      <Icon className={cn("h-4 w-4 shrink-0", meta.iconClass)} />
      <Text
        size="caption"
        tabularNums
        tone={isInsufficient ? "destructive" : "default"}
      >
        {amount.toLocaleString("ja-JP")}
      </Text>
    </div>
  );
};
