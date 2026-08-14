import { AlertTriangle } from 'lucide-react'
import { ModalFrame } from './ModalFrame.tsx'
import { Button } from './Button.tsx'

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  onConfirm,
  onClose,
}: {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <ModalFrame title={title} onClose={onClose}>
      <p className="text-muted-foreground text-sm m-0">{message}</p>
      <div className="flex justify-end mt-5">
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          <AlertTriangle size={16} aria-hidden="true" />
          {confirmLabel}
        </Button>
      </div>
    </ModalFrame>
  )
}
