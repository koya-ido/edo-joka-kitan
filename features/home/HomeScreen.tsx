import { ConfirmAlertDialog } from "@/components/shared/ConfirmAlertDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Heading, Text } from "@/components/ui/Typography";
import { HomeEquippedPreview } from "@/features/home/components/HomeEquippedPreview";
import { LoginBonusModal } from "@/features/home/components/LoginBonusModal";
import type { HomeActionsState } from "@/features/home/hooks/useHomeActions";
import type { PlayerSaveData } from "@/types";
import { Compass, Sparkles } from "lucide-react";

export interface HomeScreenProps {
  save: PlayerSaveData;
  actions: HomeActionsState;
  onNavigate: (path: string) => void;
}

export const HomeScreen = ({ save, actions, onNavigate }: HomeScreenProps) => (
  <div className="flex flex-1 flex-col justify-between gap-3.5 py-1">
    {/* 和風題字ロゴ（Webカード枠を廃し、和紙上に直接刻む） */}
    <header className="flex flex-col items-center gap-1.5 pt-1 text-center">
      <Badge variant="default" className="border border-primary/40 px-3 py-0.5 tracking-widest">
        和風縦型ローグライク防衛
      </Badge>
      <div className="flex w-full items-center gap-3">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/65" />
        <Heading as="h2" className="text-2xl font-bold leading-8 tracking-[0.14em] text-foreground">
          穢土浄化奇譚
        </Heading>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/65" />
      </div>
      <Text size="caption" tone="muted" className="font-display tracking-[0.2em]">
        〜 妖魔祓ひの旅路 〜
      </Text>
    </header>

    <HomeEquippedPreview save={save} />

    <div className="flex flex-col gap-2.5 pb-1">
      <Button
        variant="primary"
        size="lg"
        disabled={actions.isMutating}
        onClick={() => {
          onNavigate("/stages");
        }}
        className="min-h-14 w-full gap-2.5 rounded-lg border-2 border-accent/60 font-display text-lg font-bold tracking-wider"
      >
        <Compass className="h-5 w-5" aria-hidden="true" />
        出撃する
      </Button>
      <Button
        variant="outline"
        size="md"
        disabled={actions.isMutating}
        onClick={() => {
          onNavigate("/formation");
        }}
        className="w-full gap-2 font-display tracking-wider"
      >
        <Sparkles className="h-4 w-4 text-accent-foreground" aria-hidden="true" />
        編成を整える
      </Button>
    </div>

    <LoginBonusModal
      open={actions.isLoginBonusOpen}
      onOpenChange={actions.setLoginBonusOpen}
      canClaim={actions.canClaimLoginBonus}
      isPending={actions.isMutating}
      onClaim={actions.handleClaimLoginBonus}
    />

    <ConfirmAlertDialog
      open={actions.isResetDialogOpen}
      onOpenChange={actions.setResetDialogOpen}
      isPending={actions.isMutating}
      title="セーブデータを初期化しますか？"
      description="所持している翡翠・水晶の勾玉、強化レベル、獲得キャラ・武器、ステージ進行がすべて初期状態に戻ります。この操作は取り消せません。"
      confirmLabel="初期化する"
      onConfirm={actions.handleResetSave}
    />
  </div>
);
