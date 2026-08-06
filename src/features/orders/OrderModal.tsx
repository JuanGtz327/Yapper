import { useState, type FormEvent } from 'react'
import { Check, Plus, X } from 'lucide-react'
import type { Client, OrderItemInput, Product } from '../../types.ts'
import { formatMoney } from '../../lib/format.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { Empty } from '../../components/ui/Empty.tsx'

export type DraftLine = { productId: string; quantity: number }

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
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [lines, setLines] = useState<DraftLine[]>(
    products[0] ? [{ productId: products[0].id, quantity: 1 }] : [],
  )
  const [payment, setPayment] = useState<'pending' | 'paid'>('paid')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const total = lines.reduce(
    (sum, line) =>
      sum +
      (products.find((product) => product.id === line.productId)?.price ?? 0) *
        line.quantity,
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
          line.quantity >
            (products.find((product) => product.id === line.productId)?.stock ??
              0),
      )
    ) {
      setError(
        'Revisa las cantidades: usa enteros positivos sin superar las existencias disponibles.',
      )
      return
    }
    if (new Set(lines.map((line) => line.productId)).size !== lines.length) {
      setError('No repitas productos en el mismo pedido.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSubmit(clientId, lines, payment)
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
  return (
    <ModalFrame title="Crear pedido" onClose={onClose}>
      <form className="form-grid order-form" onSubmit={submit}>
        {!clients.length || !products.length ? (
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
              {lines.map((line, index) => (
                <div className="order-line" key={`${line.productId}-${index}`}>
                  <select
                    value={line.productId}
                    onChange={(event) =>
                      updateLine(index, { productId: event.target.value })
                    }
                  >
                    {products.map((product) => (
                      <option
                        disabled={product.stock === 0}
                        key={product.id}
                        value={product.id}
                      >
                        {product.name} ({product.stock} disponibles)
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
                    max={
                      products.find((product) => product.id === line.productId)
                        ?.stock ?? 1
                    }
                  />
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
              ))}
              <button
                className="add-line"
                onClick={() => {
                  const next = products.find(
                    (product) =>
                      product.stock > 0 &&
                      !lines.some((line) => line.productId === product.id),
                  )
                  if (next)
                    setLines((current) => [
                      ...current,
                      { productId: next.id, quantity: 1 },
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
                className="primary-button"
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
