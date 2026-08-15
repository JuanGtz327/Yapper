import { useState, type FormEvent } from 'react'
import { Check, Plus, X } from 'lucide-react'
import type {
  Client,
  OrderItemInput,
  Product,
  VariantOption,
  OrderDraftLine,
} from '../../types.ts'
import { formatMoney } from '../../lib/format.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
import { Empty } from '../../components/ui/Empty.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { useToast } from '../../hooks/useToast.ts'

function buildVariantOptions(products: Product[]): VariantOption[] {
  const options: VariantOption[] = []
  for (const product of products) {
    for (const variant of product.variants) {
      options.push({ variant, productName: product.name })
    }
  }
  return options
}

export function OrderModal({
  clients,
  products,
  currency,
  onClose,
  onSubmit,
}: {
  clients: Client[]
  products: Product[]
  currency: string
  onClose: () => void
  onSubmit: (
    clientId: string,
    items: OrderItemInput[],
    payment: 'pending' | 'paid',
  ) => Promise<void>
}) {
  const variantOptions = buildVariantOptions(products)
  const firstAvailable = variantOptions.find((opt) => opt.variant.stock > 0)
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [lines, setLines] = useState<OrderDraftLine[]>(
    firstAvailable
      ? [{ variantId: firstAvailable.variant.id, quantity: 1 }]
      : [],
  )
  const [payment, setPayment] = useState<'pending' | 'paid'>('paid')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const getVariantPrice = (variantId: string) =>
    variantOptions.find((opt) => opt.variant.id === variantId)?.variant
      .salePrice ?? 0

  const getVariantStock = (variantId: string) =>
    variantOptions.find((opt) => opt.variant.id === variantId)?.variant.stock ??
    0

  const total = lines.reduce(
    (sum, line) => sum + getVariantPrice(line.variantId) * line.quantity,
    0,
  )
  const money = { format: (value: number) => formatMoney(value, currency) }
  const updateLine = (index: number, value: Partial<OrderDraftLine>) =>
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...value } : line,
      ),
    )
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!clientId || !lines.length) {
      toast.error('Selecciona un cliente y al menos un producto.')
      return
    }
    if (
      lines.some(
        (line) =>
          !Number.isInteger(line.quantity) ||
          line.quantity < 1 ||
          line.quantity > getVariantStock(line.variantId),
      )
    ) {
      toast.error(
        'Revisa las cantidades: usa enteros positivos sin superar las existencias disponibles.',
      )
      return
    }
    if (new Set(lines.map((line) => line.variantId)).size !== lines.length) {
      toast.error('No repitas variantes en el mismo pedido.')
      return
    }
    setSaving(true)
    try {
      await onSubmit(
        clientId,
        lines.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
        })),
        payment,
      )
    } catch (submissionError) {
      toast.error(
        submissionError instanceof Error
          ? submissionError.message
          : 'No pudimos guardar el pedido.',
      )
    } finally {
      setSaving(false)
    }
  }

  const formatVariantLabel = (opt: VariantOption) => {
    const parts = [opt.productName]
    if (opt.variant.sku) parts.push(`(${opt.variant.sku})`)
    const opts = opt.variant.optionValues.map((ov) => ov.value).join(', ')
    if (opts) parts.push(`— ${opts}`)
    parts.push(`— ${opt.variant.stock} disponibles`)
    return parts.join(' ')
  }

  return (
    <ModalFrame title="Crear pedido" onClose={onClose}>
      <form className="grid gap-[15px] gap-4" onSubmit={submit}>
        {!clients.length || !variantOptions.length ? (
          <Empty text="Necesitas al menos un cliente y un producto para crear un pedido." />
        ) : (
          <>
            <CustomSelect
              label="Cliente"
              value={clientId}
              onChange={(val) => setClientId(val)}
              options={clients.map((client) => ({
                value: client.id,
                label: client.name,
              }))}
              placeholder="Seleccionar cliente..."
              ariaLabel="Cliente"
              searchable
            />
            <div className="grid gap-[9px]">
              <div className="flex justify-between text-[#716b72] text-[11px] font-bold">
                <span>Productos</span>
                <span>Total</span>
              </div>
              {lines.map((line, index) => {
                const selectedOpt = variantOptions.find(
                  (opt) => opt.variant.id === line.variantId,
                )
                return (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_68px_30px] items-center gap-[7px]"
                    key={`${line.variantId}-${index}`}
                  >
                    <CustomSelect
                      value={line.variantId}
                      onChange={(val) => updateLine(index, { variantId: val })}
                      options={variantOptions.map((opt) => ({
                        value: opt.variant.id,
                        label: formatVariantLabel(opt),
                      }))}
                      placeholder="Producto..."
                      ariaLabel="Producto"
                      searchable
                    />
                    <Input
                      aria-label="Cantidad"
                      value={line.quantity}
                      onChange={(event) =>
                        updateLine(index, {
                          quantity: Number(event.target.value),
                        })
                      }
                      type="number"
                      min="1"
                      max={selectedOpt?.variant.stock ?? 1}
                      step="1"
                    />
                    <span className="text-foreground text-[13px] font-bold text-right whitespace-nowrap">
                      {money.format(
                        (selectedOpt?.variant.salePrice ?? 0) * line.quantity,
                      )}
                    </span>
                    <Button
                      variant="danger"
                      icon={<X size={16} />}
                      onClick={() =>
                        setLines((current) =>
                          current.filter((_, lineIndex) => lineIndex !== index),
                        )
                      }
                      aria-label="Quitar producto"
                      type="button"
                    />
                  </div>
                )
              })}
              <button
                className="flex items-center justify-center gap-[5px] py-[9px] border border-dashed border-[#d8c8d8] rounded-[8px] text-primary bg-[#fbf7fb] text-[11px] font-bold"
                onClick={() => {
                  const next = variantOptions.find(
                    (opt) =>
                      opt.variant.stock > 0 &&
                      !lines.some((line) => line.variantId === opt.variant.id),
                  )
                  if (next)
                    setLines((current) => [
                      ...current,
                      { variantId: next.variant.id, quantity: 1 },
                    ])
                }}
                type="button"
              >
                <Plus size={15} />
                Añadir otro producto
              </button>
            </div>
            <CustomSelect
              label="Estado del pago"
              value={payment}
              onChange={(val) => setPayment(val as 'pending' | 'paid')}
              options={[
                { value: 'paid', label: 'Pagado' },
                { value: 'pending', label: 'Pendiente de pago' },
              ]}
              ariaLabel="Estado del pago"
            />
            <div className="flex items-center justify-between pt-[15px] border-t border-border text-[#716b72] text-xs">
              <span>Total del pedido</span>
              <strong className="text-primary text-[22px]">
                {money.format(total)}
              </strong>
            </div>
            <div className="flex justify-end gap-[10px] mt-[9px]">
              <Button
                variant="primary"
                disabled={saving}
                type="submit"
                icon={<Check size={18} />}
              >
                {saving ? 'Guardando...' : 'Guardar pedido'}
              </Button>
            </div>
          </>
        )}
      </form>
    </ModalFrame>
  )
}
