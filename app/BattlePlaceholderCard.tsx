import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heading, Text } from "@/components/ui/Typography";

export interface BattlePlaceholderCardProps {
  readonly title: string;
  readonly equippedCharacterId?: string;
  readonly onBackToStages: () => void;
}

export const BattlePlaceholderCard = ({
  title,
  equippedCharacterId,
  onBackToStages,
}: BattlePlaceholderCardProps) => (
  <Card.Root>
    <Card.Header>
      <div className="flex items-center justify-between gap-2">
        <Heading as="h2">{title}</Heading>
        <Badge variant="success">出撃許可済み</Badge>
      </div>
    </Card.Header>
    <Card.Content className="flex flex-col gap-3">
      <Text>
        主人公: <span className="font-semibold">{equippedCharacterId}</span>
      </Text>
      <Button
        type="button"
        variant="secondary"
        className="min-h-11 touch-manipulation"
        onClick={onBackToStages}
      >
        ステージ選択へ戻る
      </Button>
    </Card.Content>
  </Card.Root>
);
