import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import type { Client } from '../../types.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'

export function ClientModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial: Client | null
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    setSaving(true)
    setError('')
    try {
      await onSubmit(event)
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'No pudimos guardar el cliente.',
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <ModalFrame
      title={initial ? 'Editar cliente' : 'Nuevo cliente'}
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label>
          Nombre completo
          <input
            name="name"
            defaultValue={initial?.name}
            placeholder="Ej. Mariana González"
            required
          />
        </label>
        <label>
          Teléfono
          <input
            name="phone"
            defaultValue={initial?.phone}
            placeholder="55 1234 5678"
          />
        </label>
        <label>
          Zona o colonia
          <input
            name="zone"
            defaultValue={initial?.zone}
            placeholder="Ej. Coyoacán"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className={`primary-button${saving ? ' button-loading' : ''}`}
            disabled={saving}
            type="submit"
          >
            <Check size={18} aria-hidden="true" />
            {saving ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </div>
      </form>
    </ModalFrame>
  )
}
