import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { useToast } from '../../hooks/useToast.ts'
import type { Variant } from '../../types.ts'

export function RestockModal({
  variant,
  currency,
  onClose,
  onConfirm,
}: {
  variant: Variant
  currency: string
  onClose: () => void
  onConfirm: (quantity: number, unitCost: number) => Promise<void>
}) {
  const [quantity, setQuantity] = useState(1)
  const [unitCost, setUnitCost] = useState(variant.inventoryCost)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
    }).format(value)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error('La cantidad debe ser un número entero mayor a 0.')
      return
    }
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      toast.error('El costo unitario debe ser un número no negativo.')
      return
    }
    setSaving(true)
    try {
      await onConfirm(quantity, unitCost)
      toast.success(
        `Se agregaron ${quantity} unidades. Stock actual: ${variant.stock + quantity}.`,
      )
      onClose()
    } catch {
      toast.error('No pudimos registrar la compra. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalFrame title="Registrar compra" onClose={onClose}>
      <form className="grid gap-5" onSubmit={submit}>
        <div className="border border-[#e8e4e6] rounded-[10px] p-3 bg-[#f9f6fa]">
          <span className="text-[11px] font-bold uppercase tracking-[0.6px] text-muted-foreground">
            Variante
          </span>
          <p className="text-sm font-semibold text-foreground mt-1">
            {variant.sku || 'Sin SKU'}
            {variant.name ? ` — ${variant.name}` : ''}
          </p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Stock actual: {variant.stock} · Costo actual:{' '}
            {formatMoney(variant.inventoryCost)}
          </p>
        </div>

        <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
          Cantidad a agregar
          <Input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
        </label>

        <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
          Costo unitario de compra
          <Input
            type="number"
            min="0"
            step="0.01"
            value={unitCost}
            onChange={(e) => setUnitCost(Number(e.target.value))}
            required
          />
        </label>

        <div className="border border-[#e8e4e6] rounded-[10px] p-3 bg-white text-sm">
          <span className="text-muted-foreground">Total de la compra:</span>{' '}
          <strong className="text-foreground">
            {formatMoney(quantity * unitCost)}
          </strong>
        </div>

        <div className="flex justify-end gap-[10px] mt-[5px]">
          <Button
            variant="primary"
            disabled={saving}
            type="submit"
            icon={<Check size={18} aria-hidden="true" />}
          >
            {saving ? 'Registrando...' : 'Registrar compra'}
          </Button>
        </div>
      </form>
    </ModalFrame>
  )
}
