import { Pencil, X } from 'lucide-react'
import type { MouseEvent } from 'react'
import type { Order, Product } from '../../types.ts'
import { formatMoney } from '../../lib/format.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'

export function OrderTicketModal({
  order,
  products,
  currency,
  onClose,
  onEdit,
  onStatusChange,
  onPaymentChange,
  onCancel,
}: {
  order: Order
  products: Product[]
  currency: string
  onClose: () => void
  onEdit?: (order: Order) => void
  onStatusChange: (order: Order, status: 'pending' | 'delivered') => void
  onPaymentChange: (order: Order, payment: 'pending' | 'paid') => void
  onCancel: (order: Order) => void
}) {
  const lines = order.itemLines ?? []
  const lineItems = lines.map((line) => {
    if (line.productNameSnapshot) {
      return {
        name: line.productNameSnapshot,
        variantLabel: line.variantLabelSnapshot || '',
        quantity: line.quantity,
        unitPrice: line.unitPrice ?? 0,
        unitCost: line.unitCostSnapshot ?? 0,
        total: line.lineTotal ?? (line.unitPrice ?? 0) * line.quantity,
        isSnapshot: true,
      }
    }
    let productName = 'Producto no disponible'
    let variantLabel = ''
    let unitPrice = 0
    let unitCost = 0
    for (const product of products) {
      const variant = product.variants.find((v) => v.id === line.variantId)
      if (variant) {
        productName = product.name
        unitPrice = variant.salePrice
        unitCost = variant.inventoryCost
        const opts = variant.optionValues.map((ov) => ov.value).join(', ')
        variantLabel = [variant.sku, opts].filter(Boolean).join(' — ')
        break
      }
    }
    return {
      name: productName,
      variantLabel,
      quantity: line.quantity,
      unitPrice,
      unitCost,
      total: unitPrice * line.quantity,
      isSnapshot: false,
    }
  })
  const calculatedTotal = lineItems.reduce((sum, line) => sum + line.total, 0)
  const total = lineItems.length ? calculatedTotal : order.total
  return (
    <ModalFrame title={`Detalles del pedido ${order.id}`} onClose={onClose}>
      <div className="order-ticket">
        <dl className="order-detail-grid">
          <div>
            <dt>Cliente</dt>
            <dd>{order.client}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{order.date}</dd>
          </div>
          <div>
            <dt>Entrega</dt>
            <dd>
              <StatusBadge value={order.status} />
            </dd>
          </div>
          <div>
            <dt>Pago</dt>
            <dd>
              <StatusBadge value={order.payment} />
            </dd>
          </div>
        </dl>
        <section
          className="ticket-lines"
          aria-labelledby="ticket-products-title"
        >
          <div className="ticket-heading">
            <h3 id="ticket-products-title">Productos</h3>
            <span>
              {lineItems.reduce((sum, line) => sum + line.quantity, 0)} piezas
            </span>
          </div>
          {lineItems.length ? (
            <>
              <div className="ticket-columns" aria-hidden="true">
                <span>Producto</span>
                <span>Cant.</span>
                <span>Precio</span>
                <span>Total</span>
              </div>
              <ul>
                {lineItems.map((line, index) => (
                  <li key={`${line.name}-${index}`}>
                    <div className="ticket-product">
                      <strong>{line.name}</strong>
                      {line.variantLabel && (
                        <span className="detail-muted">
                          {line.variantLabel}
                        </span>
                      )}
                      <span>
                        {formatMoney(line.unitPrice, currency)} por unidad
                      </span>
                    </div>
                    <span className="ticket-quantity">{line.quantity}</span>
                    <span>{formatMoney(line.unitPrice, currency)}</span>
                    <strong>{formatMoney(line.total, currency)}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="detail-muted">
              No hay productos detallados para este pedido.
            </p>
          )}
        </section>
        <div className="ticket-total">
          <span>Total del pedido</span>
          <strong>{formatMoney(total, currency)}</strong>
        </div>
        {order.status !== 'Cancelado' && (
          <section
            className="order-detail-actions"
            aria-label="Acciones del pedido"
          >
            <div className="order-status-controls">
              <fieldset>
                <legend>Estado de entrega</legend>
                <div
                  className="segmented-control"
                  role="group"
                  aria-label={`Estado de entrega de ${order.id}`}
                >
                  <StatusButton
                    active={order.status === 'Pendiente'}
                    label="Pendiente"
                    onClick={(event) => {
                      event.stopPropagation()
                      onStatusChange(order, 'pending')
                    }}
                  />
                  <StatusButton
                    active={order.status === 'Entregado'}
                    label="Entregado"
                    onClick={(event) => {
                      event.stopPropagation()
                      onStatusChange(order, 'delivered')
                    }}
                  />
                </div>
              </fieldset>
              <fieldset>
                <legend>Estado del pago</legend>
                <div
                  className="segmented-control"
                  role="group"
                  aria-label={`Estado de pago de ${order.id}`}
                >
                  <StatusButton
                    active={order.payment === 'Pendiente'}
                    label="Pendiente"
                    onClick={(event) => {
                      event.stopPropagation()
                      onPaymentChange(order, 'pending')
                    }}
                  />
                  <StatusButton
                    active={order.payment === 'Pagado'}
                    label="Pagado"
                    onClick={(event) => {
                      event.stopPropagation()
                      onPaymentChange(order, 'paid')
                    }}
                  />
                </div>
              </fieldset>
            </div>
            <div className="modal-actions order-actions-footer">
              {onEdit && (
                <button
                  className="primary-button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onEdit(order)
                    onClose()
                  }}
                  type="button"
                >
                  <Pencil size={16} aria-hidden="true" />
                  Editar pedido
                </button>
              )}
              <button
                className="cancel-button danger-action"
                onClick={(event) => {
                  event.stopPropagation()
                  onCancel(order)
                  onClose()
                }}
                type="button"
              >
                <X size={16} aria-hidden="true" />
                Cancelar pedido
              </button>
            </div>
          </section>
        )}
      </div>
    </ModalFrame>
  )
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={
        value === 'Pagado' || value === 'Entregado'
          ? 'badge success'
          : value === 'Cancelado'
            ? 'badge danger'
            : 'badge warning'
      }
    >
      {value}
    </span>
  )
}

function StatusButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      className={`segmented-control-button${active ? ' is-active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}
