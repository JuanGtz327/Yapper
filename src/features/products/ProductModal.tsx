import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import type { Product } from '../../types.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'

export function ProductModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial: Product | null
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
          : 'No pudimos guardar el producto.',
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <ModalFrame
      title={initial ? 'Editar producto' : 'Añadir producto'}
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label>
          Nombre del producto
          <input
            name="name"
            defaultValue={initial?.name}
            placeholder="Ej. Tupper rectangular 1L"
            required
          />
        </label>
        <label>
          Categoría
          <input
            name="category"
            defaultValue={initial?.category}
            placeholder="Ej. Recipientes"
          />
        </label>
        <div className="form-two">
          <label>
            Precio de venta
            <input
              name="price"
              defaultValue={initial?.price}
              type="number"
              min="0"
              step="1"
              placeholder="$ 0"
              required
            />
          </label>
          <label>
            Existencias
            <input
              name="stock"
              defaultValue={initial?.stock}
              type="number"
              min="0"
              step="1"
              placeholder="0"
              required
            />
          </label>
        </div>
        <fieldset className="public-settings">
          <legend>Publicación</legend>
          <label className="checkbox-label">
            <input
              name="published"
              type="checkbox"
              defaultChecked={initial?.published ?? false}
            />
            Mostrar en mi catálogo público
          </label>
          <label>
            Descripción pública
            <textarea
              name="publicDescription"
              defaultValue={initial?.publicDescription}
              maxLength={240}
            />
          </label>
          <label>
            Imagen pública (URL)
            <input
              name="imageUrl"
              type="url"
              inputMode="url"
              pattern="https://.*"
              title="Usa una URL que comience con https://"
              defaultValue={initial?.imageUrl ?? ''}
            />
          </label>
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="primary-button" disabled={saving} type="submit">
            <Check size={18} aria-hidden="true" />
            {saving ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </form>
    </ModalFrame>
  )
}
