import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Heading, Text } from "@/components/ui/Typography";
import { cn } from "@/components/ui/cn";

export interface StatSummaryDeltas {
  readonly hp?: number;
  readonly atk?: number;
  readonly luk?: number;
}

export interface StatSummaryGridProps {
  hp: number;
  atk: number;
  luk: number;
  title?: string;
  subtitle?: string;
  deltas?: StatSummaryDeltas;
  className?: string;
}

interface StatCellItem {
  readonly key: "hp" | "atk" | "luk";
  readonly label: string;
  readonly valueText: string;
  readonly deltaText: string | null;
}

export const StatSummaryGrid = ({
  hp,
  atk,
  luk,
  title = "総合基礎ステータス",
  subtitle,
  deltas,
  className,
}: StatSummaryGridProps) => {
  const items: readonly StatCellItem[] = [
    {
      key: "hp",
      label: "結界耐久",
      valueText: String(hp),
      deltaText: deltas?.hp && deltas.hp > 0 ? `+${String(deltas.hp)}` : null,
    },
    {
      key: "atk",
      label: "霊力攻撃",
      valueText: String(atk),
      deltaText:
        deltas?.atk && deltas.atk > 0 ? `+${String(deltas.atk)}` : null,
    },
    {
      key: "luk",
      label: "会心発生率",
      valueText: `${String(luk)}%`,
      deltaText:
        deltas?.luk && deltas.luk > 0 ? `+${String(deltas.luk)}%` : null,
    },
  ];

  return (
    <Card.Root className={cn("overflow-hidden", className)}>
      <Card.Header className="pb-2">
        <div className="flex flex-col gap-1">
          <Heading as="h2">{title}</Heading>
          {subtitle && (
            <Text size="caption" tone="muted">
              {subtitle}
            </Text>
          )}
        </div>
      </Card.Header>
      <Separator />
      <Card.Content className="pt-3">
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex flex-col items-center gap-1 rounded-md border border-border bg-background/60 px-2 py-2 text-center"
            >
              <Text size="caption" tone="muted">
                {item.label}
              </Text>
              <Text
                size="body"
                tabularNums
                className="text-base text-foreground"
              >
                {item.valueText}
              </Text>
              {item.deltaText && (
                <Text
                  size="caption"
                  tone="success"
                  tabularNums
                  className="font-semibold"
                >
                  ({item.deltaText})
                </Text>
              )}
            </div>
          ))}
        </div>
      </Card.Content>
    </Card.Root>
  );
};
