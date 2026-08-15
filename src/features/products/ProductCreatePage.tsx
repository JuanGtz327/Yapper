import { useState, useEffect, useRef, type FormEvent } from 'react'
import { ArrowLeft, Check, Image, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Product, OptionTypeWithValues } from '../../types.ts'
import { CategoryManagerModal } from './CategoryManagerModal.tsx'
import { VariantModal } from './VariantModal.tsx'
import { ConfirmModal } from '../../components/ui/ConfirmModal.tsx'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Checkbox } from '../../components/ui/Checkbox.tsx'
import { Textarea } from '../../components/ui/Textarea.tsx'
import { useToast } from '../../hooks/useToast.ts'
import {
  validateProductDraft,
  type ProductDraft,
  type VariantDraft,
} from './validateProductDraft.ts'

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

function draftFromProduct(
  product: Product,
  optionTypes: OptionTypeWithValues[],
): ProductDraft {
  return {
    name: product.name,
    categoryId: product.categoryId,
    published: product.published,
    publicDescription: product.publicDescription,
    imageUrl: product.imageUrl ?? '',
    variants: product.variants.map((v) => {
      const optionValueIds: string[] = []
      for (const ov of v.optionValues) {
        const type = optionTypes.find((t) => t.name === ov.optionType)
        if (type) {
          const val = type.values.find((vv) => vv.name === ov.value)
          if (val) optionValueIds.push(val.id)
        }
      }
      return {
        id: v.id,
        sku: v.sku,
        name: v.name,
        inventoryCost: v.inventoryCost,
        salePrice: v.salePrice,
        stock: v.stock,
        optionValueIds,
      }
    }),
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
  return (
    <span className="block text-[#aa6259] text-[11px] mt-[2px]">{msg}</span>
  )
}

export function ProductCreatePage({
  initial,
  categories,
  optionTypes,
  onCategoryCreated,
  onVariantsChanged,
  onClose,
  onRemove,
  onSubmit,
}: {
  initial: Product | null
  categories: Array<{ id: string; name: string }>
  optionTypes: OptionTypeWithValues[]
  onCategoryCreated: () => void
  onVariantsChanged: () => void
  onClose: () => void
  onRemove?: (id: string) => void
  onSubmit: (draft: ProductDraft) => Promise<boolean>
}) {
  const [draft, setDraft] = useState<ProductDraft>(
    initial ? draftFromProduct(initial, optionTypes) : newDraft,
  )
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [variantModalOpen, setVariantModalOpen] = useState(false)
  const [editingVariantIdx, setEditingVariantIdx] = useState<number | null>(
    null,
  )
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null)
  const shouldAutoSubmit = useRef(false)
  const toast = useToast()

  useEffect(() => {
    if (initial) setDraft(draftFromProduct(initial, optionTypes))
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

  const editingVariantOriginalOptionValues =
    editingVariantIdx !== null && initial
      ? (initial.variants[editingVariantIdx]?.optionValues ?? [])
      : []

  const editingVariantFromDraft =
    editingVariantIdx !== null ? draft.variants[editingVariantIdx] : null

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
    shouldAutoSubmit.current = true
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

  const saveProduct = async (draftToSave: ProductDraft) => {
    const result = validateProductDraft(draftToSave)
    if (!result.ok) {
      setErrors(result.errors)
      toast.error('Revisa los campos marcados.')
      return false
    }
    setErrors({})
    setSaving(true)
    try {
      const ok = await onSubmit(draftToSave)
      if (!ok) return false
      onVariantsChanged()
      return true
    } finally {
      setSaving(false)
    }
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
    await saveProduct(trimmed)
  }

  useEffect(() => {
    if (!shouldAutoSubmit.current) return
    shouldAutoSubmit.current = false
    void saveProduct(draft)
  }, [draft])

  return (
    <section className="animate-[page-in_0.25s_ease_both]">
      <div className="flex items-end justify-between mb-[27px] max-[650px]:flex-col max-[650px]:items-start max-[650px]:gap-[17px]">
        <div>
          <h1>{initial ? 'Editar producto' : 'Nuevo producto'}</h1>
          <p>
            {initial
              ? 'Modifica la información de tu producto.'
              : 'Completa los datos para crear un nuevo producto.'}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {initial && onRemove && (
            <Button
              variant="danger"
              icon={<Trash2 size={16} aria-hidden="true" />}
              onClick={() => {
                onRemove(initial.id)
                onClose()
              }}
              type="button"
            >
              Eliminar producto
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onClose}
            type="button"
            icon={<ArrowLeft size={16} aria-hidden="true" />}
          >
            Volver
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)] gap-4">
        <form
          className="border border-[#ebe8e4] rounded-[13px] bg-[#fffefa] p-[23px_24px] grid gap-6"
          onSubmit={submit}
        >
          {/* ── INFORMACIÓN BÁSICA ─────────────────────────── */}
          <div className="grid gap-4">
            <span className="block text-[10px] font-bold uppercase tracking-[0.7px] text-[#6d3c72] mb-3">
              INFORMACIÓN BÁSICA
            </span>
            <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
              Nombre del producto
              <Input
                value={draft.name}
                onChange={(e) => {
                  setDraft({ ...draft, name: e.target.value })
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
                }}
                placeholder="Ej. Tupper rectangular 1L"
                maxLength={120}
                className={errors.name ? 'border-[#aa6259]' : ''}
              />
              <FieldError errors={errors} name="name" />
            </label>
            <div className="flex gap-[6px] items-center">
              <div className="min-w-0 flex-1">
                <CustomSelect
                  label="Categoría"
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
                  ariaLabel="Categoría"
                  searchable
                />
              </div>
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setCategoryManagerOpen(true)}
                type="button"
                aria-label="Gestionar categorías"
              />
            </div>
          </div>

          <div className="h-px bg-[#e8e4e6]" />

          {/* ── VARIANTES ───────────────────────────────────── */}
          <div className="grid gap-4">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="block text-[10px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
                VARIANTES
              </span>
              <span className="text-[#aaa5a8] text-[10px] font-normal">
                Cada variante define su propio SKU, precio y existencias.
              </span>
            </div>
            {errors.variants && (
              <span className="block text-[#aa6259] text-[11px] mt-[2px]">
                {errors.variants}
              </span>
            )}
            {draft.variants.length > 0 ? (
              <ul className="grid gap-[6px] p-0 m-0 list-none">
                {draft.variants.map((variant, idx) => (
                  <li
                    key={variant.id ?? idx}
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
                    </div>
                    <div className="flex gap-1 shrink-0">
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
              <p className="text-[12px] text-muted-foreground m-0 mb-2">
                Aún no tienes variantes. Agrega al menos una.
              </p>
            )}
            <Button
              variant="secondary"
              className="mt-3"
              onClick={openAddVariant}
              type="button"
              icon={<Plus size={15} aria-hidden="true" />}
            >
              Añadir variante
            </Button>
          </div>

          <div className="h-px bg-[#e8e4e6]" />

          {/* ── CATÁLOGO PÚBLICO ───────────────────────────── */}
          <div className="grid gap-4">
            <span className="block text-[10px] font-bold uppercase tracking-[0.7px] text-[#6d3c72] mb-3">
              CATÁLOGO PÚBLICO
            </span>
            <label className="flex! items-center gap-2! text-[#716b72] text-[11px] font-bold">
              <Checkbox
                checked={draft.published}
                onChange={(e) =>
                  setDraft({ ...draft, published: e.target.checked })
                }
              />
              Mostrar en mi catálogo público
            </label>
            <label className="mt-2 grid gap-[6px] text-[#716b72] text-[11px] font-bold">
              Descripción pública
              <Textarea
                value={draft.publicDescription}
                onChange={(e) =>
                  setDraft({ ...draft, publicDescription: e.target.value })
                }
                maxLength={240}
                placeholder="Breve descripción para tu catálogo."
                className={errors.publicDescription ? 'border-[#aa6259]' : ''}
              />
              <FieldError errors={errors} name="publicDescription" />
            </label>
            <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
              Imagen pública (URL)
              <Input
                type="url"
                inputMode="url"
                value={draft.imageUrl}
                onChange={(e) =>
                  setDraft({ ...draft, imageUrl: e.target.value })
                }
                placeholder="https://..."
                className={errors.imageUrl ? 'border-[#aa6259]' : ''}
              />
              <FieldError errors={errors} name="imageUrl" />
            </label>
          </div>

          {/* ── ACTIONS ─────────────────────────────────────── */}
          <div className="flex justify-end gap-[10px] mt-[9px]">
            <Button
              variant="primary"
              disabled={saving}
              type="submit"
              icon={<Check size={18} aria-hidden="true" />}
            >
              {saving
                ? 'Guardando...'
                : initial
                  ? 'Guardar cambios'
                  : 'Crear producto'}
            </Button>
          </div>
        </form>

        {/* ── PREVIEW ────────────────────────────────────────── */}
        <aside className="border border-[#ebe8e4] rounded-[13px] bg-[#fffefa] p-[23px_24px] self-start grid gap-6">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
              VISTA PREVIA
            </span>
            <h3 className="text-foreground text-base">
              Cómo se ve en tu catálogo
            </h3>
            <div className="mt-[14px] border border-border rounded-xl overflow-hidden bg-white">
              {draft.imageUrl ? (
                <img
                  src={draft.imageUrl}
                  alt={draft.name || 'Vista previa'}
                  className="w-full h-[160px] object-cover block"
                />
              ) : (
                <div className="w-full h-[160px] flex flex-col items-center justify-center gap-[6px] bg-[#f3f1ef] text-muted-foreground text-xs">
                  <Image
                    size={28}
                    aria-hidden="true"
                    className="text-[#c9bfca]"
                  />
                  <span>Sin imagen</span>
                </div>
              )}
              <div className="p-3.5 grid gap-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-primary">
                  {selectedCategoryName}
                </span>
                <strong className="text-[15px] text-foreground">
                  {draft.name || 'Nombre del producto'}
                </strong>
                {draft.variants.length > 0 && (
                  <span className="text-sm font-bold text-foreground mt-[2px]">
                    ${draft.variants[0].salePrice || '0'}
                  </span>
                )}
                {draft.publicDescription && (
                  <p className="text-xs text-muted-foreground leading-[1.5] mt-[6px]">
                    {draft.publicDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="h-px bg-[#e8e4e6]" />
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
              RESUMEN
            </span>
            <ul className="list-none p-0 mt-2.5 grid gap-[6px] text-xs text-muted-foreground">
              <li>
                Variantes:{' '}
                <strong className="text-foreground">
                  {draft.variants.length}
                </strong>
              </li>
              <li>
                Publicado:{' '}
                <strong className="text-foreground">
                  {draft.published ? 'Sí' : 'No'}
                </strong>
              </li>
              <li>
                SKU principal:{' '}
                <strong className="text-foreground">
                  {draft.variants[0]?.sku || '—'}
                </strong>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* ── VARIANT MODAL ──────────────────────────────────── */}
      {variantModalOpen && (
        <VariantModal
          variant={editingVariantFromDraft}
          optionTypes={optionTypes}
          initialOptionValues={editingVariantOriginalOptionValues}
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
