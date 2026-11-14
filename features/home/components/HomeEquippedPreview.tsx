import { ItemAvatar } from "@/components/shared/ItemAvatar";
import { AspectRatio } from "@/components/ui/AspectRatio";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Heading, Text } from "@/components/ui/Typography";
import { CHARACTER_MASTER_MAP, WEAPON_MASTER_MAP } from "@/data";
import { BattleStageBackdrop } from "@/features/home/components/BattleStageBackdrop";
import type { PlayerSaveData, WeaponGenre } from "@/types";

const WEAPON_GENRE_LABELS: Readonly<Record<WeaponGenre, string>> = {
  bow: "弓矢系",
  sword: "刀剣系",
  shuriken: "手裏剣系",
  mirror: "鏡系",
  talisman: "呪符系",
  matchlock: "火縄銃系",
  fan: "扇・軍配系",
  orb: "霊珠・勾玉系",
};

export interface HomeEquippedPreviewProps {
  save: PlayerSaveData;
}

export const HomeEquippedPreview = ({ save }: HomeEquippedPreviewProps) => {
  const charMaster = Object.hasOwn(CHARACTER_MASTER_MAP, save.equippedCharacterId)
    ? CHARACTER_MASTER_MAP[save.equippedCharacterId]
    : undefined;
  const weaponMaster = Object.hasOwn(WEAPON_MASTER_MAP, save.equippedWeaponId)
    ? WEAPON_MASTER_MAP[save.equippedWeaponId]
    : undefined;
  const charState = Object.hasOwn(save.ownedCharacters, save.equippedCharacterId)
    ? save.ownedCharacters[save.equippedCharacterId]
    : undefined;
  const weaponState = Object.hasOwn(save.ownedWeapons, save.equippedWeaponId)
    ? save.ownedWeapons[save.equippedWeaponId]
    : undefined;

  if (!charMaster || !weaponMaster || !charState || !weaponState) {
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

        <div className="relative z-10 grid grid-cols-2 items-center gap-3 py-1">
          <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
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

          <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
            <div className="rounded-full p-1 ring-2 ring-accent/45 ring-offset-2 ring-offset-battle-surface">
              <ItemAvatar
                kind="weapon"
                size="lg"
                name={weaponMaster.name}
                badgeLabel={`精錬Lv.${String(weaponState.refineLevel)}`}
              />
            </div>
            <Text size="caption" className="text-battle-foreground/80">
              {WEAPON_GENRE_LABELS[weaponMaster.genre]}
            </Text>
            <Heading as="h3" className="text-base leading-5 text-battle-foreground">
              {weaponMaster.name}
            </Heading>
          </div>
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
        <Text size="caption">{charMaster.passiveSkill.description}</Text>
      </Card.Content>
    </Card.Root>
  );
};
