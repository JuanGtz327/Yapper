import { useState, useEffect, type FormEvent } from 'react'
import { ArrowLeft, Check, Image, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Product } from '../../types.ts'
import { CategoryManagerModal } from './CategoryManagerModal.tsx'
import { VariantModal } from './VariantModal.tsx'
import { ConfirmModal } from '../../components/ui/ConfirmModal.tsx'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { useToast } from '../../hooks/useToast.ts'
import {
  validateProductDraft,
  type ProductDraft,
  type VariantDraft,
} from './validateProductDraft.ts'

type OptionTypeWithValues = {
  id: string
  name: string
  values: Array<{ id: string; name: string }>
}

function newDraft(): ProductDraft {
  return {
    name: '',
    categoryId: null,
    published: false,
    publicDescription: '',
    imageUrl: '',
    variants: [],
  }
}

function draftFromProduct(product: Product): ProductDraft {
  return {
    name: product.name,
    categoryId: product.categoryId,
    published: product.published,
    publicDescription: product.publicDescription,
    imageUrl: product.imageUrl ?? '',
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      inventoryCost: v.inventoryCost,
      salePrice: v.salePrice,
      stock: v.stock,
      optionValueIds: [],
    })),
  }
}

function FieldError({
  errors,
  name,
}: {
  errors: Record<string, string>
  name: string
}) {
  const msg = errors[name]
  if (!msg) return null
  return <span className="field-error">{msg}</span>
}

export function ProductCreatePage({
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
  onSubmit: (draft: ProductDraft) => Promise<boolean>
}) {
  const [draft, setDraft] = useState<ProductDraft>(
    initial ? draftFromProduct(initial) : newDraft,
  )
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [variantModalOpen, setVariantModalOpen] = useState(false)
  const [editingVariantIdx, setEditingVariantIdx] = useState<number | null>(
    null,
  )
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null)
  const toast = useToast()

  useEffect(() => {
    if (initial) setDraft(draftFromProduct(initial))
  }, [initial])

  const selectedCategoryName =
    categories.find((c) => c.id === draft.categoryId)?.name ?? 'Sin categoría'

  const openAddVariant = () => {
    setEditingVariantIdx(null)
    setVariantModalOpen(true)
  }

  const openEditVariant = (index: number) => {
    setEditingVariantIdx(index)
    setVariantModalOpen(true)
  }

  const handleSaveVariant = (data: VariantDraft) => {
    if (editingVariantIdx !== null) {
      setDraft((prev) => ({
        ...prev,
        variants: prev.variants.map((v, i) =>
          i === editingVariantIdx ? { ...v, ...data } : v,
        ),
      }))
    } else {
      setDraft((prev) => ({
        ...prev,
        variants: [...prev.variants, data],
      }))
    }
    setVariantModalOpen(false)
    setEditingVariantIdx(null)
  }

  const confirmRemoveVariant = (index: number) => {
    setConfirmDeleteIdx(index)
  }

  const removeVariant = () => {
    if (confirmDeleteIdx === null) return
    setDraft((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== confirmDeleteIdx),
    }))
    setConfirmDeleteIdx(null)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = {
      ...draft,
      name: draft.name.trim(),
      publicDescription: draft.publicDescription.trim(),
      imageUrl: draft.imageUrl.trim(),
    }
    setDraft(trimmed)

    const result = validateProductDraft(trimmed)
    if (!result.ok) {
      setErrors(result.errors)
      toast.error('Revisa los campos marcados.')
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const ok = await onSubmit(trimmed)
      if (!ok) return
      onVariantsChanged()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-section">
      <div className="section-intro">
        <div>
          <span className="eyebrow">CONTROL DE INVENTARIO</span>
          <h2>{initial ? 'Editar producto' : 'Nuevo producto'}</h2>
          <p>
            {initial
              ? 'Modifica la información de tu producto.'
              : 'Completa los datos para crear un nuevo producto.'}
          </p>
        </div>
        <div className="section-actions">
          <button
            className="secondary-button"
            onClick={onClose}
            type="button"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Volver
          </button>
        </div>
      </div>
      <div className="settings-layout">
        <form className="panel form-grid" onSubmit={submit}>
          {/* ── INFORMACIÓN BÁSICA ─────────────────────────── */}
          <fieldset className="product-section">
            <legend>Información básica</legend>
            <label>
              Nombre del producto
              <input
                value={draft.name}
                onChange={(e) => {
                  setDraft({ ...draft, name: e.target.value })
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
                }}
                placeholder="Ej. Tupper rectangular 1L"
                maxLength={120}
                className={errors.name ? 'input-error' : ''}
              />
              <FieldError errors={errors} name="name" />
            </label>
            <label className="category-row">
              Categoría
              <div className="category-selector">
                <CustomSelect
                  value={draft.categoryId ?? ''}
                  onChange={(val) =>
                    setDraft({ ...draft, categoryId: val || null })
                  }
                  options={[
                    { value: '', label: 'Sin categoría' },
                    ...categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    })),
                  ]}
                  placeholder="Sin categoría"
                />
                <Button
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={() => setCategoryManagerOpen(true)}
                  type="button"
                  aria-label="Gestionar categorías"
                />
              </div>
            </label>
          </fieldset>

          {/* ── VARIANTES ───────────────────────────────────── */}
          <fieldset className="product-section">
            <legend>
              Variantes
              <span className="field-help">
                Cada variante define su propio SKU, precio y existencias.
              </span>
            </legend>
            {errors.variants && (
              <span className="field-error">{errors.variants}</span>
            )}
            {draft.variants.length > 0 ? (
              <ul className="variant-list">
                {draft.variants.map((variant, idx) => (
                  <li key={variant.id ?? idx} className="variant-list-item">
                    <div className="variant-info">
                      <strong>{variant.sku}</strong>
                      <span className="variant-meta">
                        {variant.name && `${variant.name} · `}
                        ${variant.salePrice} · {variant.stock} uds
                      </span>
                    </div>
                    <div className="variant-actions">
                      <Button
                        variant="primary"
                        icon={<Pencil size={15} />}
                        onClick={() => openEditVariant(idx)}
                        type="button"
                        aria-label={`Editar variante ${variant.sku}`}
                      />
                      <Button
                        variant="danger"
                        icon={<Trash2 size={15} />}
                        onClick={() => confirmRemoveVariant(idx)}
                        type="button"
                        aria-label={`Eliminar variante ${variant.sku}`}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="variant-empty-hint">
                Aún no tienes variantes. Agrega al menos una.
              </p>
            )}
            <button
              className="secondary-button variant-add-btn"
              onClick={openAddVariant}
              type="button"
            >
              <Plus size={15} aria-hidden="true" />
              Añadir variante
            </button>
          </fieldset>

          {/* ── CATÁLOGO PÚBLICO ───────────────────────────── */}
          <fieldset className="product-section">
            <legend>Catálogo público</legend>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) =>
                  setDraft({ ...draft, published: e.target.checked })
                }
              />
              Mostrar en mi catálogo público
            </label>
            <label className="public-description-gap">
              Descripción pública
              <textarea
                value={draft.publicDescription}
                onChange={(e) =>
                  setDraft({ ...draft, publicDescription: e.target.value })
                }
                maxLength={240}
                placeholder="Breve descripción para tu catálogo."
                className={
                  errors.publicDescription ? 'input-error' : ''
                }
              />
              <FieldError errors={errors} name="publicDescription" />
            </label>
            <label>
              Imagen pública (URL)
              <input
                type="url"
                inputMode="url"
                value={draft.imageUrl}
                onChange={(e) =>
                  setDraft({ ...draft, imageUrl: e.target.value })
                }
                placeholder="https://..."
                className={errors.imageUrl ? 'input-error' : ''}
              />
              <FieldError errors={errors} name="imageUrl" />
            </label>
          </fieldset>

          {/* ── ACTIONS ─────────────────────────────────────── */}
          <div className="modal-actions">
            <button
              className="cancel-button"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className={`primary-button${saving ? ' button-loading' : ''}`}
              disabled={saving}
              type="submit"
            >
              <Check size={18} aria-hidden="true" />
              {saving
                ? 'Guardando...'
                : initial
                  ? 'Guardar cambios'
                  : 'Crear producto'}
            </button>
          </div>
        </form>

        {/* ── PREVIEW ────────────────────────────────────────── */}
        <aside className="panel product-preview-panel">
          <span className="eyebrow">VISTA PREVIA</span>
          <h3>Cómo se ve en tu catálogo</h3>
          <div className="product-preview-card">
            {draft.imageUrl ? (
              <img
                src={draft.imageUrl}
                alt={draft.name || 'Vista previa'}
                className="product-preview-image"
              />
            ) : (
              <div className="product-preview-placeholder">
                <Image size={28} aria-hidden="true" />
                <span>Sin imagen</span>
              </div>
            )}
            <div className="product-preview-body">
              <span className="product-preview-category">
                {selectedCategoryName}
              </span>
              <strong className="product-preview-name">
                {draft.name || 'Nombre del producto'}
              </strong>
              {draft.variants.length > 0 && (
                <span className="product-preview-price">
                  ${draft.variants[0].salePrice || '0'}
                </span>
              )}
              {draft.publicDescription && (
                <p className="product-preview-desc">
                  {draft.publicDescription}
                </p>
              )}
            </div>
          </div>
          <div className="settings-section-divider" />
          <span className="eyebrow">RESUMEN</span>
          <ul className="product-preview-summary">
            <li>
              Variantes: <strong>{draft.variants.length}</strong>
            </li>
            <li>
              Publicado:{' '}
              <strong>{draft.published ? 'Sí' : 'No'}</strong>
            </li>
            <li>
              SKU principal:{' '}
              <strong>{draft.variants[0]?.sku || '—'}</strong>
            </li>
          </ul>
        </aside>
      </div>

      {/* ── VARIANT MODAL ──────────────────────────────────── */}
      {variantModalOpen && (
        <VariantModal
          variant={
            editingVariantIdx !== null
              ? draft.variants[editingVariantIdx]
              : null
          }
          optionTypes={optionTypes}
          onClose={() => {
            setVariantModalOpen(false)
            setEditingVariantIdx(null)
          }}
          onSave={handleSaveVariant}
        />
      )}

      {/* ── CATEGORY MANAGER MODAL ──────────────────────────── */}
      {categoryManagerOpen && (
        <CategoryManagerModal
          categories={categories}
          onSelect={(id) => {
            setDraft({ ...draft, categoryId: id })
            setCategoryManagerOpen(false)
          }}
          onCategoryCreated={onCategoryCreated}
          onClose={() => setCategoryManagerOpen(false)}
        />
      )}

      {/* ── CONFIRM DELETE ──────────────────────────────────── */}
      {confirmDeleteIdx !== null && (
        <ConfirmModal
          title="Eliminar variante"
          message={`¿Eliminar la variante ${draft.variants[confirmDeleteIdx]?.sku ?? ''}?`}
          danger
          confirmLabel="Eliminar"
          onConfirm={removeVariant}
          onClose={() => setConfirmDeleteIdx(null)}
        />
      )}
    </section>
  )
}
