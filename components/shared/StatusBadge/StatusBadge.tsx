import { Badge, type BadgeVariant } from "@/components/ui/Badge";

export type DomainStatusType =
  | "unverified"
  | "cleared"
  | "locked"
  | "new"
  | "awakening"
  | "refine"
  | "converted"
  | "equipped";

export interface StatusBadgeProps {
  status: DomainStatusType;
  label?: string;
  className?: string;
}

const STATUS_META: Record<
  DomainStatusType,
  { readonly variant: BadgeVariant; readonly defaultLabel: string }
> = {
  unverified: { variant: "warning", defaultLabel: "未浄化" },
  cleared: { variant: "success", defaultLabel: "浄化済み" },
  locked: { variant: "muted", defaultLabel: "未解放" },
  new: { variant: "accent", defaultLabel: "新規獲得" },
  awakening: { variant: "success", defaultLabel: "覚醒 Lv+1" },
  refine: { variant: "success", defaultLabel: "精錬 Lv+1" },
  converted: { variant: "warning", defaultLabel: "上限→勾玉変換済み" },
  equipped: { variant: "success", defaultLabel: "編成中" },
};

/** ドメイン状態をセマンティックトークン準拠の和風バッジへ変換する */
export const StatusBadge = ({ status, label, className }: StatusBadgeProps) => {
  const meta = STATUS_META[status];
  return (
    <Badge variant={meta.variant} className={className}>
      {label ?? meta.defaultLabel}
    </Badge>
  );
};
