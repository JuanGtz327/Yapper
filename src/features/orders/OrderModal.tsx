import { useState, type FormEvent } from 'react'
import { Check, Plus, X } from 'lucide-react'
import type { Client, OrderItemInput, Product, Variant } from '../../types.ts'
import { formatMoney } from '../../lib/format.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
import { Empty } from '../../components/ui/Empty.tsx'
import { useToast } from '../../hooks/useToast.ts'

export type DraftLine = { variantId: string; quantity: number }

type VariantOption = {
  variant: Variant
  productName: string
}

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
  const [lines, setLines] = useState<DraftLine[]>(
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
  const updateLine = (index: number, value: Partial<DraftLine>) =>
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
      <form className="form-grid order-form" onSubmit={submit}>
        {!clients.length || !variantOptions.length ? (
          <Empty text="Necesitas al menos un cliente y un producto para crear un pedido." />
        ) : (
          <>
            <label>
              Cliente
              <CustomSelect
                value={clientId}
                onChange={(val) => setClientId(val)}
                options={clients.map((client) => ({
                  value: client.id,
                  label: client.name,
                }))}
                placeholder="Seleccionar cliente..."
              />
            </label>
            <div className="order-lines">
              <div className="line-heading">
                <span>Productos</span>
                <span>Total</span>
              </div>
              {lines.map((line, index) => {
                const selectedOpt = variantOptions.find(
                  (opt) => opt.variant.id === line.variantId,
                )
                return (
                  <div
                    className="order-line"
                    key={`${line.variantId}-${index}`}
                  >
                    <CustomSelect
                      value={line.variantId}
                      onChange={(val) =>
                        updateLine(index, { variantId: val })
                      }
                      options={variantOptions.map((opt) => ({
                        value: opt.variant.id,
                        label: formatVariantLabel(opt),
                      }))}
                      placeholder="Producto..."
                    />
                    <input
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
                    <span className="line-total">
                      {money.format(
                        (selectedOpt?.variant.salePrice ?? 0) * line.quantity,
                      )}
                    </span>
                    <button
                      className="icon-button danger"
                      onClick={() =>
                        setLines((current) =>
                          current.filter((_, lineIndex) => lineIndex !== index),
                        )
                      }
                      aria-label="Quitar producto"
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )
              })}
              <button
                className="add-line"
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
            <label>
              Estado del pago
              <CustomSelect
                value={payment}
                onChange={(val) =>
                  setPayment(val as 'pending' | 'paid')
                }
                options={[
                  { value: 'paid', label: 'Pagado' },
                  { value: 'pending', label: 'Pendiente de pago' },
                ]}
              />
            </label>
            <div className="order-total">
              <span>Total del pedido</span>
              <strong>{money.format(total)}</strong>
            </div>
            <div className="modal-actions">
              <button className="cancel-button" onClick={onClose} type="button">
                Cancelar
              </button>
              <button
                className={`primary-button${saving ? ' button-loading' : ''}`}
                disabled={saving}
                type="submit"
              >
                <Check size={18} />
                {saving ? 'Guardando...' : 'Guardar pedido'}
              </button>
            </div>
          </>
        )}
      </form>
    </ModalFrame>
  )
}
