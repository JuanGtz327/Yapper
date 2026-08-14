import { useState, type FormEvent } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
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
    toast.success(variant ? 'Variante actualizada.' : 'Variante añadida.')
  }

  return (
    <ModalFrame
      title={variant ? 'Editar variante' : 'Añadir variante'}
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label>
          SKU
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Ej. TUP-REC-1L-NEG"
            required
          />
        </label>
        <label>
          Nombre de variante
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Negro, 1L"
          />
        </label>
        <div className="form-two">
          <label>
            Precio de venta
            <input
              type="number"
              min="0"
              step="1"
              value={salePrice || ''}
              onChange={(e) => setSalePrice(Number(e.target.value))}
              placeholder="$ 0"
              required
            />
          </label>
          <label>
            Costo de inventario
            <input
              type="number"
              min="0"
              step="1"
              value={inventoryCost || ''}
              onChange={(e) => setInventoryCost(Number(e.target.value))}
              placeholder="$ 0"
            />
          </label>
        </div>
        <label>
          Existencias
          <input
            type="number"
            min="0"
            step="1"
            value={stock || ''}
            onChange={(e) => setStock(Number(e.target.value))}
            placeholder="0"
            required
          />
        </label>
        {optionTypes.length > 0 && (
          <fieldset className="variant-options">
            <legend>Opciones</legend>
            {selections.map((sel, idx) => {
              const type = optionTypes.find((t) => t.id === sel.typeId)
              const valuesForType = type?.values ?? []
              return (
                <div key={idx} className="option-selection-row">
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
                  />
                  <button
                    className="icon-button danger"
                    onClick={() => removeSelection(idx)}
                    type="button"
                    aria-label="Quitar opción"
                  >
                    <X size={15} />
                  </button>
                </div>
              )
            })}
            {availableTypes.length > 0 && (
              <button
                className="secondary-button option-add-btn"
                onClick={addSelection}
                type="button"
              >
                <Plus size={14} aria-hidden="true" />
                Agregar opción
              </button>
            )}
          </fieldset>
        )}
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="primary-button" type="submit">
            <Check size={18} aria-hidden="true" />
            {variant ? 'Guardar variante' : 'Añadir variante'}
          </button>
        </div>
      </form>
    </ModalFrame>
  )
}
