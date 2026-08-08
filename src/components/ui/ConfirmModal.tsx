import { AlertTriangle } from 'lucide-react'
import { ModalFrame } from './ModalFrame.tsx'

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
      <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
        {message}
      </p>
      <div className="modal-actions" style={{ marginTop: 20 }}>
        <button className="cancel-button" onClick={onClose} type="button">
          Cancelar
        </button>
        <button
          className={`primary-button${danger ? ' danger-action' : ''}`}
          onClick={() => {
            onConfirm()
            onClose()
          }}
          type="button"
        >
          <AlertTriangle size={16} aria-hidden="true" />
          {confirmLabel}
        </button>
      </div>
    </ModalFrame>
  )
}
