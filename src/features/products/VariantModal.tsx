import { useState, type FormEvent } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
import { useToast } from '../../hooks/useToast.ts'
import type { VariantDraft } from './validateProductDraft.ts'
import type { OptionTypeWithValues } from '../../types.ts'

type OptionSelection = {
  typeId: string
  valueId: string
}

function buildInitialOptions(
  optionValues: Array<{ optionType: string; value: string }>,
  optionTypes: OptionTypeWithValues[],
): OptionSelection[] {
  if (optionValues.length === 0) return []
  const selections: OptionSelection[] = []
  for (const ov of optionValues) {
    const type = optionTypes.find((t) => t.name === ov.optionType)
    if (type) {
      const val = type.values.find((v) => v.name === ov.value)
      if (val) {
        selections.push({ typeId: type.id, valueId: val.id })
      }
    }
  }
  return selections
}

function buildInitialOptionsFromIds(
  optionValueIds: string[],
  optionTypes: OptionTypeWithValues[],
): OptionSelection[] {
  if (optionValueIds.length === 0) return []
  const selections: OptionSelection[] = []
  for (const type of optionTypes) {
    const matchedValueId = type.values.find((v) =>
      optionValueIds.includes(v.id),
    )?.id
    if (matchedValueId) {
      selections.push({ typeId: type.id, valueId: matchedValueId })
    }
  }
  return selections
}

export function VariantModal({
  variant,
  optionTypes,
  initialOptionValues,
  onClose,
  onSave,
}: {
  variant: VariantDraft | null
  optionTypes: OptionTypeWithValues[]
  initialOptionValues?: Array<{ optionType: string; value: string }>
  onClose: () => void
  onSave: (data: VariantDraft) => void
}) {
  const [sku, setSku] = useState(variant?.sku ?? '')
  const [name, setName] = useState(variant?.name ?? '')
  const [salePrice, setSalePrice] = useState(variant?.salePrice ?? 0)
  const [inventoryCost, setInventoryCost] = useState(
    variant?.inventoryCost ?? 0,
  )
  const [stock, setStock] = useState(variant?.stock ?? 0)
  const [open, setOpen] = useState(true)
  const [selections, setSelections] = useState<OptionSelection[]>(() => {
    if (!variant) return []
    if (initialOptionValues && initialOptionValues.length > 0) {
      return buildInitialOptions(initialOptionValues, optionTypes)
    }
    if (variant.optionValueIds.length > 0) {
      return buildInitialOptionsFromIds(variant.optionValueIds, optionTypes)
    }
    return []
  })
  const toast = useToast()
  const close = () => {
    setOpen(false)
    onClose()
  }

  const updateSelection = (index: number, patch: Partial<OptionSelection>) => {
    setSelections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    )
  }

  const addSelection = () => {
    setSelections((prev) => [...prev, { typeId: '', valueId: '' }])
  }

  const removeSelection = (index: number) => {
    setSelections((prev) => prev.filter((_, i) => i !== index))
  }

  const availableTypes = optionTypes.filter(
    (t) => !selections.some((s) => s.typeId === t.id),
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmedSku = sku.trim()
    if (!trimmedSku) {
      toast.error('El SKU es obligatorio.')
      return
    }
    if (trimmedSku.length > 40) {
      toast.error('El SKU no puede exceder 40 caracteres.')
      return
    }
    if (!Number.isFinite(salePrice) || salePrice < 0) {
      toast.error('Introduce un precio de venta válido.')
      return
    }
    if (!Number.isInteger(stock) || stock < 0) {
      toast.error('Las existencias deben ser un número entero no negativo.')
      return
    }

    const optionValueIds = selections
      .filter((s) => s.valueId)
      .map((s) => s.valueId)

    onSave({
      id: variant?.id,
      sku: trimmedSku,
      name: name.trim(),
      salePrice,
      inventoryCost,
      stock,
      optionValueIds,
    })
    close()
  }

  return (
    <ModalFrame
      title={variant ? 'Editar variante' : 'Añadir variante'}
      open={open}
      onClose={close}
    >
      <form className="grid gap-6" onSubmit={submit}>
        {/* ── INFORMACIÓN BÁSICA ─────────────────────────── */}
        <div className="grid gap-4">
          <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
            INFORMACIÓN BÁSICA
          </span>
          <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
            SKU
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Ej. TUP-REC-1L-NEG"
              required
            />
          </label>
          <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
            Nombre de variante
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Negro, 1L"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
              Precio de venta
              <Input
                type="number"
                min="0"
                step="1"
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                placeholder="$ 0"
                required
              />
            </label>
            <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
              Costo de inventario
              <Input
                type="number"
                min="0"
                step="1"
                value={inventoryCost}
                onChange={(e) => setInventoryCost(Number(e.target.value))}
                placeholder="$ 0"
              />
            </label>
          </div>
          <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
            Existencias
            <Input
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              placeholder="0"
              required
            />
          </label>
        </div>

        {/* ── OPCIONES ────────────────────────────────────── */}
        {optionTypes.length > 0 && (
          <>
            <div className="h-px bg-[#e8e4e6]" />
            <div className="grid gap-4">
              <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
                OPCIONES
              </span>
              {selections.map((sel, idx) => {
                const type = optionTypes.find((t) => t.id === sel.typeId)
                const valuesForType = type?.values ?? []
                return (
                  <div key={idx} className="flex gap-[6px] items-center">
                    <CustomSelect
                      value={sel.typeId}
                      onChange={(val) =>
                        updateSelection(idx, { typeId: val, valueId: '' })
                      }
                      options={optionTypes.map((t) => ({
                        value: t.id,
                        label: t.name,
                      }))}
                      placeholder="Tipo..."
                      ariaLabel="Tipo de opción"
                      searchable
                    />
                    <CustomSelect
                      value={sel.valueId}
                      onChange={(val) => updateSelection(idx, { valueId: val })}
                      options={valuesForType.map((v) => ({
                        value: v.id,
                        label: v.name,
                      }))}
                      placeholder="Valor..."
                      disabled={!sel.typeId}
                      ariaLabel="Valor de opción"
                      searchable
                    />
                    <Button
                      variant="danger"
                      icon={<X size={15} />}
                      onClick={() => removeSelection(idx)}
                      type="button"
                      aria-label="Quitar opción"
                    />
                  </div>
                )
              })}
              {availableTypes.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={addSelection}
                  type="button"
                  icon={<Plus size={14} aria-hidden="true" />}
                >
                  Agregar opción
                </Button>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end gap-[10px]">
          <Button
            variant="primary"
            type="submit"
            icon={<Check size={18} aria-hidden="true" />}
          >
            {variant ? 'Guardar variante' : 'Añadir variante'}
          </Button>
        </div>
      </form>
    </ModalFrame>
  )
}
