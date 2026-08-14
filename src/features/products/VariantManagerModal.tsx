import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import type { Variant, OptionTypeWithValues } from '../../types.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { useToast } from '../../hooks/useToast.ts'

export function VariantManagerModal({
  variant,
  optionTypes,
  onClose,
  onSave,
}: {
  variant: Variant | null
  optionTypes: OptionTypeWithValues[]
  onClose: () => void
  onSave: (data: {
    sku: string
    name: string
    inventoryCost: number
    salePrice: number
    stock: number
    optionValueIds: string[]
  }) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  // Initialize selected option values from the existing variant
  const initialOptionValues: Record<string, string> = {}
  if (variant) {
    for (const ov of variant.optionValues) {
      const type = optionTypes.find((t) => t.name === ov.optionType)
      if (type) {
        const val = type.values.find((v) => v.name === ov.value)
        if (val) initialOptionValues[type.id] = val.id
      }
    }
  }

  const [selectedOptions, setSelectedOptions] =
    useState<Record<string, string>>(initialOptionValues)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const sku = String(form.get('sku') || '').trim()
    const name = String(form.get('name') || '').trim()
    const salePrice = Number(form.get('salePrice'))
    const inventoryCost = Number(form.get('inventoryCost') ?? 0)
    const stock = Number(form.get('stock'))

    if (!sku) {
      toast.error('El SKU es obligatorio.')
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

    const optionValueIds = Object.values(selectedOptions).filter(Boolean)

    setSaving(true)
    try {
      await onSave({
        sku,
        name,
        inventoryCost,
        salePrice,
        stock,
        optionValueIds,
      })
    } catch (submissionError) {
      toast.error(
        submissionError instanceof Error
          ? submissionError.message
          : 'No pudimos guardar la variante.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalFrame
      title={variant ? 'Editar variante' : 'Añadir variante'}
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label>
          SKU
          <Input
            name="sku"
            defaultValue={variant?.sku}
            placeholder="Ej. TUP-REC-1L-NEG"
            required
          />
        </label>
        <label>
          Nombre de variante
          <Input
            name="name"
            defaultValue={variant?.name}
            placeholder="Ej. Negro, 1L"
          />
        </label>
        <div className="grid grid-cols-2 gap-[15px]">
          <label>
            Precio de venta
            <Input
              name="salePrice"
              defaultValue={variant?.salePrice}
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
              defaultValue={variant?.inventoryCost ?? 0}
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
            defaultValue={variant?.stock}
            type="number"
            min="0"
            step="1"
            placeholder="0"
            required
          />
        </label>
        {optionTypes.length > 0 && (
          <fieldset className="border border-[#e8e4e6] rounded-[10px] p-[14px] bg-[#fdfcfc]">
            <legend className="text-[13px] font-bold text-foreground">Opciones</legend>
            {optionTypes.map((type) => (
              <label key={type.id}>
                {type.name}
                <select
                  value={selectedOptions[type.id] ?? ''}
                  onChange={(e) =>
                    setSelectedOptions((prev) => ({
                      ...prev,
                      [type.id]: e.target.value,
                    }))
                  }
                >
                  <option value="">Sin selección</option>
                  {type.values.map((val) => (
                    <option key={val.id} value={val.id}>
                      {val.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </fieldset>
        )}
        <div className="flex justify-end gap-[10px] mt-[9px]">
          <Button
            variant="primary"
            disabled={saving}
            type="submit"
            icon={<Check size={18} aria-hidden="true" />}
          >
            {saving
              ? 'Guardando...'
              : variant
                ? 'Guardar variante'
                : 'Añadir variante'}
          </Button>
        </div>
      </form>
    </ModalFrame>
  )
}
