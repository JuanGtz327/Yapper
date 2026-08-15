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
      <form className="grid gap-6" onSubmit={submit}>
        {/* ── INFORMACIÓN BÁSICA ─────────────────────────── */}
        <div className="grid gap-4">
          <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
            INFORMACIÓN BÁSICA
          </span>
          <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
            Nombre del producto
            <Input
              name="name"
              defaultValue={initial?.name}
              placeholder="Ej. Tupper rectangular 1L"
              required
            />
          </label>
          <label className="category-row grid gap-[6px] text-[#716b72] text-[11px] font-bold">
            Categoría
            <div className="category-selector">
              <select
                className="appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2712%27%20height%3D%2712%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%23716b72%27%20stroke-width%3D%272%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_10px_center] pr-[30px]! cursor-pointer"
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
        </div>

        {/* ── VARIANTES ───────────────────────────────────── */}
        {initial && (
          <>
            <div className="h-px bg-[#e8e4e6]" />
            <div className="grid gap-4">
              <div className="flex items-baseline gap-2">
                <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
                  VARIANTES
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setVariantManagerOpen(true)}
                  type="button"
                  icon={<Plus size={15} aria-hidden="true" />}
                >
                  Añadir variante
                </Button>
              </div>
              <ul className="grid gap-[6px] p-0 m-0 list-none">
                {initial.variants.map((variant) => (
                  <li
                    key={variant.id}
                    className="flex items-center justify-between gap-[10px] p-[10px_12px] border border-[#e8e4e6] rounded-[8px] bg-white hover:bg-[#f3eef4]"
                  >
                    <div className="flex flex-col gap-[2px] min-w-0">
                      <strong className="text-[13px] text-foreground">
                        {variant.sku}
                      </strong>
                      <span className="text-[12px] text-muted-foreground">
                        {variant.name && `${variant.name} · `}$
                        {variant.salePrice} · {variant.stock} uds
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
          </>
        )}

        {/* ── SKU Y PRECIO ────────────────────────────────── */}
        {!initial && (
          <>
            <div className="h-px bg-[#e8e4e6]" />
            <div className="grid gap-4">
              <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
                SKU Y PRECIO
              </span>
              <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
                SKU
                <Input name="sku" placeholder="Ej. TUP-REC-1L" required />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
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
                <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
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
              <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
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
            </div>
          </>
        )}

        {/* ── PUBLICACIÓN ──────────────────────────────────── */}
        <div className="h-px bg-[#e8e4e6]" />
        <div className="grid gap-4">
          <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
            PUBLICACIÓN
          </span>
          <label className="flex! items-center gap-2! text-[#716b72] text-[11px] font-bold">
            <input
              className="w-auto!"
              name="published"
              type="checkbox"
              defaultChecked={initial?.published ?? false}
            />
            Mostrar en mi catálogo público
          </label>
          <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
            Descripción pública
            <textarea
              name="publicDescription"
              defaultValue={initial?.publicDescription}
              maxLength={240}
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-semibold outline-none placeholder:text-muted-foreground placeholder:font-normal focus:border-ring focus:ring-1 focus:ring-ring/30 disabled:opacity-50 resize-y"
            />
          </label>
          <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
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
        </div>
        <div className="flex justify-end gap-[10px]">
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
