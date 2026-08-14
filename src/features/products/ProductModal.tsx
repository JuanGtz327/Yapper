import { useState, type FormEvent } from 'react'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Product, Variant, OptionTypeWithValues } from '../../types.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { ConfirmModal } from '../../components/ui/ConfirmModal.tsx'
import { CategoryManagerModal } from './CategoryManagerModal.tsx'
import { VariantManagerModal } from './VariantManagerModal.tsx'
import {
  createVariant,
  updateVariant,
  deleteVariant,
} from '../../lib/repository.ts'
import { useToast, toastMessages } from '../../hooks/useToast.ts'

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
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initial?.categoryId ?? '',
  )
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [variantManagerOpen, setVariantManagerOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)
  const [confirmState, setConfirmState] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)
  const toast = useToast()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    setSaving(true)
    try {
      await onSubmit(event)
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
    toast.success(
      editingVariant
        ? toastMessages.variant.updated
        : toastMessages.variant.created,
    )
    setVariantManagerOpen(false)
    setEditingVariant(null)
    onVariantsChanged()
  }

  const handleDeleteVariant = async (variant: Variant) => {
    if (!initial) return
    if (initial.variants.length <= 1) {
      toast.error('No puedes eliminar la única variante de un producto.')
      return
    }
    setConfirmState({
      title: 'Eliminar variante',
      message: `¿Eliminar la variante ${variant.sku}?`,
      onConfirm: async () => {
        try {
          await deleteVariant(variant.id)
          toast.success(toastMessages.variant.deleted)
          onVariantsChanged()
        } catch {
          toast.error('No pudimos eliminar la variante.')
        }
      },
    })
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
          <Input
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
            <Button
              variant="ghost"
              icon={<Plus size={16} />}
              onClick={() => setCategoryManagerOpen(true)}
              type="button"
              aria-label="Gestionar categorías"
            />
          </div>
        </label>
        {initial && (
          <div className="border border-[#e8e4e6] rounded-[10px] p-[14px] bg-[#fdfcfc]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-bold text-foreground">Variantes</span>
              <Button
                variant="secondary"
                onClick={() => setVariantManagerOpen(true)}
                type="button"
              >
                <Plus size={15} aria-hidden="true" />
                Añadir variante
              </Button>
            </div>
            <ul className="grid gap-[6px] p-0 m-0 list-none">
              {initial.variants.map((variant) => (
                <li key={variant.id} className="flex items-center justify-between gap-[10px] p-[10px_12px] border border-[#e8e4e6] rounded-[8px] bg-white hover:bg-[#f3eef4]">
                  <div className="flex flex-col gap-[2px] min-w-0">
                    <strong className="text-[13px] text-foreground">{variant.sku}</strong>
                    <span className="text-[12px] text-muted-foreground">
                      {variant.name && `${variant.name} · `}${variant.salePrice}{' '}
                      · {variant.stock} uds
                    </span>
                    {variant.optionValues.length > 0 && (
                      <span className="text-[11px] text-primary bg-[#f3eef4] rounded-[6px] py-[2px] px-2 w-fit">
                        {variant.optionValues
                          .map((ov) => `${ov.optionType}: ${ov.value}`)
                          .join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      icon={<Pencil size={15} />}
                      onClick={() => {
                        setEditingVariant(variant)
                        setVariantManagerOpen(true)
                      }}
                      type="button"
                      aria-label={`Editar variante ${variant.sku}`}
                    />
                    <Button
                      variant="danger"
                      icon={<Trash2 size={15} />}
                      onClick={() => handleDeleteVariant(variant)}
                      type="button"
                      aria-label={`Eliminar variante ${variant.sku}`}
                    />
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
              <Input name="sku" placeholder="Ej. TUP-REC-1L" required />
            </label>
            <div className="form-two">
              <label>
                Precio de venta
                <Input
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
                <Input
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
              <Input
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
        <fieldset className="grid gap-3 p-[14px] border border-[var(--line)] rounded-[10px]">
          <legend className="px-[5px] text-primary text-xs font-bold">Publicación</legend>
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
            <Input
              name="imageUrl"
              type="url"
              inputMode="url"
              pattern="https://.*"
              title="Usa una URL que comience con https://"
              defaultValue={initial?.imageUrl ?? ''}
            />
          </label>
        </fieldset>
        <div className="modal-actions">
          <Button
            variant="primary"
            disabled={saving}
            type="submit"
            icon={<Check size={18} aria-hidden="true" />}
          >
            {saving ? 'Guardando...' : 'Guardar producto'}
          </Button>
        </div>
      </form>
      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          danger
          confirmLabel="Eliminar"
          onConfirm={() => void confirmState.onConfirm()}
          onClose={() => setConfirmState(null)}
        />
      )}
    </ModalFrame>
  )
}
