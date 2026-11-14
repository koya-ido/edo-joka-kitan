import { ItemAvatar } from "@/components/shared/ItemAvatar";
import { AspectRatio } from "@/components/ui/AspectRatio";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Heading, Text } from "@/components/ui/Typography";
import { CHARACTER_MASTER_MAP } from "@/data";
import { BattleStageBackdrop } from "@/features/home/components/BattleStageBackdrop";
import type { PlayerSaveData } from "@/types";

export interface HomeEquippedPreviewProps {
  save: PlayerSaveData;
}

export const HomeEquippedPreview = ({ save }: HomeEquippedPreviewProps) => {
  const charMaster = Object.hasOwn(CHARACTER_MASTER_MAP, save.equippedCharacterId)
    ? CHARACTER_MASTER_MAP[save.equippedCharacterId]
    : undefined;
  const charState = Object.hasOwn(save.ownedCharacters, save.equippedCharacterId)
    ? save.ownedCharacters[save.equippedCharacterId]
    : undefined;

  if (!charMaster || !charState) {
    return null;
  }

  return (
    <Card.Root className="overflow-hidden border-2 border-accent/55 shadow-lg">
      <AspectRatio
        ratio={16 / 9}
        className="relative flex flex-col justify-between bg-battle-surface p-3.5 text-battle-foreground"
      >
        <BattleStageBackdrop />

        <div className="relative z-10 flex items-center justify-between gap-2">
          <Badge variant="accent" className="border border-accent-foreground/20 shadow-xs">
            現在の出撃編成
          </Badge>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-1.5 py-1 text-center">
          <div className="rounded-full p-1 ring-2 ring-primary/45 ring-offset-2 ring-offset-battle-surface">
            <ItemAvatar
              kind="character"
              size="lg"
              name={charMaster.name}
              badgeLabel={`覚醒Lv.${String(charState.awakeningLevel)}`}
            />
          </div>
          <Text size="caption" className="text-battle-foreground/80">
            {charMaster.title}
          </Text>
          <Heading as="h3" className="text-base leading-5 text-battle-foreground">
            {charMaster.name}
          </Heading>
        </div>
      </AspectRatio>

      <Card.Content className="flex flex-col gap-1 border-t-2 border-accent/35 bg-card/95 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <Text size="caption" tone="muted" className="font-semibold">
            固有パッシブ
          </Text>
          <Badge variant="muted" className="border border-border">
            {charMaster.passiveSkill.name}
          </Badge>
        </div>
        <Text size="caption" tone="muted" className="line-clamp-1">
          {charMaster.passiveSkill.description}
        </Text>
      </Card.Content>
    </Card.Root>
  );
};
