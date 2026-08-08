import { useState, type FormEvent } from 'react'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Product, Variant } from '../../types.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { CategoryManagerModal } from './CategoryManagerModal.tsx'
import { VariantManagerModal } from './VariantManagerModal.tsx'
import { createVariant, updateVariant, deleteVariant } from '../../lib/repository.ts'

type OptionTypeWithValues = {
  id: string
  name: string
  values: Array<{ id: string; name: string }>
}

export function ProductModal({
  initial,
  categories,
  optionTypes,
  onCategoryCreated,
  onVariantsChanged,
  onClose,
  onSubmit,
}: {
  initial: Product | null
  categories: Array<{ id: string; name: string }>
  optionTypes: OptionTypeWithValues[]
  onCategoryCreated: () => void
  onVariantsChanged: () => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initial?.categoryId ?? '',
  )
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [variantManagerOpen, setVariantManagerOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)

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

  const handleSaveVariant = async (data: {
    sku: string
    name: string
    inventoryCost: number
    salePrice: number
    stock: number
    optionValueIds: string[]
  }) => {
    if (!initial) return
    if (editingVariant) {
      await updateVariant(editingVariant.id, data)
    } else {
      await createVariant(initial.id, data)
    }
    setVariantManagerOpen(false)
    setEditingVariant(null)
    onVariantsChanged()
  }

  const handleDeleteVariant = async (variant: Variant) => {
    if (!initial) return
    if (initial.variants.length <= 1) {
      setError('No puedes eliminar la única variante de un producto.')
      return
    }
    if (!window.confirm(`¿Eliminar la variante ${variant.sku}?`)) return
    try {
      await deleteVariant(variant.id)
      onVariantsChanged()
    } catch {
      setError('No pudimos eliminar la variante.')
    }
  }

  if (categoryManagerOpen) {
    return (
      <CategoryManagerModal
        categories={categories}
        onSelect={(id) => {
          setSelectedCategoryId(id)
          setCategoryManagerOpen(false)
        }}
        onCategoryCreated={onCategoryCreated}
        onClose={() => setCategoryManagerOpen(false)}
      />
    )
  }

  if (variantManagerOpen) {
    return (
      <VariantManagerModal
        variant={editingVariant}
        optionTypes={optionTypes}
        onClose={() => {
          setVariantManagerOpen(false)
          setEditingVariant(null)
        }}
        onSave={handleSaveVariant}
      />
    )
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
        <label className="category-row">
          Categoría
          <div className="category-selector">
            <select
              name="categoryId"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              className="icon-button"
              onClick={() => setCategoryManagerOpen(true)}
              type="button"
              aria-label="Gestionar categorías"
            >
              <Plus size={16} />
            </button>
          </div>
        </label>
        {initial && (
          <div className="variant-section">
            <div className="variant-section-header">
              <span className="variant-section-title">Variantes</span>
              <button
                className="secondary-button"
                onClick={() => setVariantManagerOpen(true)}
                type="button"
              >
                <Plus size={15} aria-hidden="true" />
                Añadir variante
              </button>
            </div>
            <ul className="variant-list">
              {initial.variants.map((variant) => (
                <li key={variant.id} className="variant-list-item">
                  <div className="variant-info">
                    <strong>{variant.sku}</strong>
                    <span className="variant-meta">
                      {variant.name && `${variant.name} · `}
                      ${variant.salePrice} · {variant.stock} uds
                    </span>
                    {variant.optionValues.length > 0 && (
                      <span className="variant-options-badge">
                        {variant.optionValues
                          .map((ov) => `${ov.optionType}: ${ov.value}`)
                          .join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="variant-actions">
                    <button
                      className="icon-button"
                      onClick={() => {
                        setEditingVariant(variant)
                        setVariantManagerOpen(true)
                      }}
                      type="button"
                      aria-label={`Editar variante ${variant.sku}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button danger"
                      onClick={() => handleDeleteVariant(variant)}
                      type="button"
                      aria-label={`Eliminar variante ${variant.sku}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!initial && (
          <>
            <label>
              SKU
              <input
                name="sku"
                placeholder="Ej. TUP-REC-1L"
                required
              />
            </label>
            <div className="form-two">
              <label>
                Precio de venta
                <input
                  name="salePrice"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="$ 0"
                  required
                />
              </label>
              <label>
                Costo de inventario
                <input
                  name="inventoryCost"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="$ 0"
                />
              </label>
            </div>
            <label>
              Existencias
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                required
              />
            </label>
          </>
        )}
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
          <button
            className={`primary-button${saving ? ' button-loading' : ''}`}
            disabled={saving}
            type="submit"
          >
            <Check size={18} aria-hidden="true" />
            {saving ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </form>
    </ModalFrame>
  )
}
