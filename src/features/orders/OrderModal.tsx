import { useState, type FormEvent } from 'react'
import { Check, Plus, X } from 'lucide-react'
import type { Client, OrderItemInput, Product, Variant } from '../../types.ts'
import { formatMoney } from '../../lib/format.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { Empty } from '../../components/ui/Empty.tsx'

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
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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
      setError('Selecciona un cliente y al menos un producto.')
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
      setError(
        'Revisa las cantidades: usa enteros positivos sin superar las existencias disponibles.',
      )
      return
    }
    if (new Set(lines.map((line) => line.variantId)).size !== lines.length) {
      setError('No repitas variantes en el mismo pedido.')
      return
    }
    setSaving(true)
    setError('')
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
      setError(
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
              <select
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
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
                    <select
                      value={line.variantId}
                      onChange={(event) =>
                        updateLine(index, { variantId: event.target.value })
                      }
                    >
                      {variantOptions.map((opt) => (
                        <option
                          disabled={opt.variant.stock === 0}
                          key={opt.variant.id}
                          value={opt.variant.id}
                        >
                          {formatVariantLabel(opt)}
                        </option>
                      ))}
                    </select>
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
              <select
                value={payment}
                onChange={(event) =>
                  setPayment(event.target.value as 'pending' | 'paid')
                }
              >
                <option value="paid">Pagado</option>
                <option value="pending">Pendiente de pago</option>
              </select>
            </label>
            <div className="order-total">
              <span>Total del pedido</span>
              <strong>{money.format(total)}</strong>
            </div>
            {error && <p className="form-error">{error}</p>}
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
