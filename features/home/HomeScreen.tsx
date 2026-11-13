import { ConfirmAlertDialog } from "@/components/shared/ConfirmAlertDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
  <div className="flex flex-col gap-4">
    <Card.Root className="border-primary/25 bg-card">
      <Card.Content className="flex flex-col items-center gap-1.5 py-5 text-center">
        <Badge variant="accent">和風縦型ローグライク防衛</Badge>
        <Heading as="h2" className="text-2xl leading-8">
          穢土浄化奇譚
        </Heading>
        <Text size="caption" tone="muted">
          〜 妖魔祓ひの旅路 〜
        </Text>
      </Card.Content>
    </Card.Root>

    <HomeEquippedPreview save={save} />

    <div className="flex flex-col gap-2 pt-1">
      <Button
        variant="primary"
        size="lg"
        disabled={actions.isMutating}
        onClick={() => {
          onNavigate("/stages");
        }}
        className="w-full gap-2"
      >
        <Compass className="h-5 w-5" aria-hidden="true" />
        出撃する（ステージ選択へ）
      </Button>
      <Button
        variant="outline"
        size="md"
        disabled={actions.isMutating}
        onClick={() => {
          onNavigate("/formation");
        }}
        className="w-full gap-2"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
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
