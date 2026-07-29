import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = 'Confirmar exclusão',
  description = 'Esta ação não pode ser desfeita.',
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent data-testid="confirm-dialog-content">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} data-testid="confirm-dialog-cancel">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} data-testid="confirm-dialog-confirm">{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
