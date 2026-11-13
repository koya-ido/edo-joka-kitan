import { AlertDialog } from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";

export interface ConfirmAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

export const ConfirmAlertDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "確定する",
  cancelLabel = "キャンセル",
  isPending = false,
  destructive = true,
  onConfirm,
}: ConfirmAlertDialogProps) => {
  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending && !nextOpen) {
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Content>
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description>{description}</AlertDialog.Description>
        <div className="mt-6 flex justify-end gap-3">
          <AlertDialog.Cancel asChild>
            <Button variant="secondary" disabled={isPending}>
              {cancelLabel}
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action asChild>
            <Button
              variant={destructive ? "destructive" : "primary"}
              isPending={isPending}
              onClick={() => {
                void onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
};
