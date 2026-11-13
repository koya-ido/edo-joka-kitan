import { ItemAvatar } from "@/components/shared/ItemAvatar";
import { AspectRatio } from "@/components/ui/AspectRatio";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Heading, Text } from "@/components/ui/Typography";
import { CHARACTER_MASTER_MAP, WEAPON_MASTER_MAP } from "@/data";
import type { PlayerSaveData, WeaponGenre } from "@/types";
import { Shield } from "lucide-react";

const WEAPON_GENRE_LABELS: Readonly<Record<WeaponGenre, string>> = {
  bow: "弓矢系",
  sword: "刀剣系",
  shuriken: "手裏剣系",
  mirror: "鏡系",
  talisman: "呪符系",
  matchlock: "火縄銃系",
  fan: "扇・軍配系",
  bell: "神具・鈴系",
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
    <Card.Root className="overflow-hidden">
      <AspectRatio
        ratio={16 / 9}
        className="flex flex-col justify-between bg-battle-surface p-4 text-battle-foreground"
      >
        <div className="flex items-center justify-between gap-2">
          <Badge variant="accent">現在の出撃編成</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-battle-foreground/80">
            <Shield className="h-3.5 w-3.5 text-barrier" aria-hidden="true" />
            <span>解放済: {save.unlockedStageIds.length} 節</span>
          </span>
        </div>

        <div className="flex items-center justify-around gap-4 py-1">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <ItemAvatar
              kind="character"
              size="lg"
              name={charMaster.name}
              badgeLabel={`覚醒Lv.${String(charState.awakeningLevel)}`}
            />
            <Text size="caption" className="text-battle-foreground/80">
              {charMaster.title}
            </Text>
            <Heading as="h3" className="text-base leading-5 text-battle-foreground">
              {charMaster.name}
            </Heading>
          </div>

          <Separator orientation="vertical" className="h-16 bg-border/30" />

          <div className="flex flex-col items-center gap-1.5 text-center">
            <ItemAvatar
              kind="weapon"
              size="lg"
              name={weaponMaster.name}
              badgeLabel={`精錬Lv.${String(weaponState.refineLevel)}`}
            />
            <Text size="caption" className="text-battle-foreground/80">
              {WEAPON_GENRE_LABELS[weaponMaster.genre]}
            </Text>
            <Heading as="h3" className="text-base leading-5 text-battle-foreground">
              {weaponMaster.name}
            </Heading>
          </div>
        </div>
      </AspectRatio>

      <Card.Content className="flex flex-col gap-1.5 pt-3">
        <div className="flex items-center justify-between gap-2">
          <Text size="caption" tone="muted">
            固有パッシブ
          </Text>
          <Badge variant="muted">{charMaster.passiveSkill.name}</Badge>
        </div>
        <Text size="caption">{charMaster.passiveSkill.description}</Text>
      </Card.Content>
    </Card.Root>
  );
};
