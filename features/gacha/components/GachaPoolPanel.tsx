import { HisuiIcon } from "@/components/icons";
import { ItemAvatar } from "@/components/shared/ItemAvatar";
import { AspectRatio } from "@/components/ui/AspectRatio";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Popover } from "@/components/ui/Popover";
import { Heading, Text } from "@/components/ui/Typography";
import {
  CHARACTER_MASTER_MAP,
  GACHA_CONFIG,
  WEAPON_MASTER_MAP,
} from "@/data";
import type { GachaPullCount } from "@/domain";
import type { GachaPoolType } from "@/types";
import { HelpCircle, Sparkles } from "lucide-react";

interface Props {
  poolType: GachaPoolType;
  hisuiBalance: number;
  isPulling: boolean;
  isDisabled: boolean;
  onPull: (poolType: GachaPoolType, count: GachaPullCount) => void;
  onOpenRates: () => void;
}

export const GachaPoolPanel = ({
  poolType,
  hisuiBalance,
  isPulling,
  isDisabled,
  onPull,
  onOpenRates,
}: Props) => {
  const isCharacter = poolType === "character";
  const featuredChar = CHARACTER_MASTER_MAP.white_fox_miko;
  const featuredWeapon = WEAPON_MASTER_MAP.bow_azusa;

  const singleCost = GACHA_CONFIG.singleCostHisui;
  const multiCost = GACHA_CONFIG.multiCostHisui;
  const canPullSingle = hisuiBalance >= singleCost;
  const canPullMulti = hisuiBalance >= multiCost;

  return (
    <Card.Root className="flex flex-col gap-3">
      <Card.Header className="flex flex-row items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <Badge variant="accent">注目</Badge>
          <Heading as="h2">
            {isCharacter ? "英霊召喚の儀" : "霊具鍛造の儀"}
          </Heading>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onOpenRates}
          disabled={isDisabled}
        >
          提供割合
        </Button>
      </Card.Header>

      <Card.Content className="flex flex-col gap-3">
        <AspectRatio ratio={16 / 9}>
          <div className="flex h-full w-full items-center gap-3 rounded-md border border-accent/50 bg-secondary/70 p-3">
            <ItemAvatar
              kind={isCharacter ? "character" : "weapon"}
              name={isCharacter ? featuredChar.name : featuredWeapon.name}
              badgeLabel="注目"
              size="lg"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Heading as="h3" className="truncate">
                {isCharacter ? featuredChar.name : featuredWeapon.name}
              </Heading>
              <Text size="caption" tone="muted" className="line-clamp-3">
                {isCharacter
                  ? featuredChar.description
                  : featuredWeapon.description}
              </Text>
            </div>
          </div>
        </AspectRatio>

        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/60 px-3 py-2">
          <Text size="caption" tone="muted">
            所持翡翠:{" "}
            <span className="font-bold text-hisui tabular-nums">
              {hisuiBalance}
            </span>{" "}
            個
          </Text>
          <Popover.Root>
            <Popover.Trigger asChild>
              <Button type="button" variant="ghost" size="sm">
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                変換ルール
              </Button>
            </Popover.Trigger>
            <Popover.Content align="end">
              <div className="flex flex-col gap-1.5">
                <Heading as="h4">重複・上限変換ルール</Heading>
                <Text size="caption">
                  所持済みの{isCharacter ? "キャラ" : "武器"}
                  が排出されると、勾玉を消費せず自動で
                  {isCharacter ? "覚醒" : "精錬"}レベルが +1 されます。
                </Text>
                <Text size="caption" tone="muted">
                  既に最大レベルに到達している場合は、余剰分として「水晶の勾玉」へ自動変換されます。
                </Text>
              </div>
            </Popover.Content>
          </Popover.Root>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              isPending={isPulling}
              disabled={isDisabled || !canPullSingle}
              onClick={() => {
                onPull(poolType, 1);
              }}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>1回召喚</span>
              <HisuiIcon className="h-4 w-4 shrink-0 text-hisui" aria-hidden="true" />
              <span className="tabular-nums">×{singleCost}</span>
            </Button>
            {!canPullSingle && (
              <Text size="caption" tone="destructive" className="text-center">
                翡翠あと {singleCost - hisuiBalance} 個不足
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="primary"
              className="w-full"
              isPending={isPulling}
              disabled={isDisabled || !canPullMulti}
              onClick={() => {
                onPull(poolType, 10);
              }}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>10回召喚</span>
              <HisuiIcon className="h-4 w-4 shrink-0 text-hisui" aria-hidden="true" />
              <span className="tabular-nums">×{multiCost}</span>
            </Button>
            {!canPullMulti && (
              <Text size="caption" tone="destructive" className="text-center">
                翡翠あと {multiCost - hisuiBalance} 個不足
              </Text>
            )}
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  );
};
