import { X } from 'lucide-react'
import type { Order, Product } from '../../types.ts'
import { formatMoney } from '../../lib/format.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'

export function OrderTicketModal({
  order,
  products,
  currency,
  onClose,
  onCancel,
}: {
  order: Order
  products: Product[]
  currency: string
  onClose: () => void
  onCancel: (order: Order) => void
}) {
  const lines = order.itemLines ?? []
  const lineItems = lines.map((line) => {
    const product = products.find((item) => item.id === line.productId)
    const unitPrice = product?.price ?? 0
    return {
      name: product?.name ?? 'Producto no disponible',
      quantity: line.quantity,
      unitPrice,
      total: unitPrice * line.quantity,
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
              <span
                className={
                  order.status === 'Entregado'
                    ? 'badge success'
                    : 'badge warning'
                }
              >
                {order.status}
              </span>
            </dd>
          </div>
          <div>
            <dt>Pago</dt>
            <dd>
              <span
                className={
                  order.payment === 'Pagado' ? 'badge success' : 'badge warning'
                }
              >
                {order.payment}
              </span>
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
          <div className="modal-actions">
            <button
              className="cancel-button danger-action"
              onClick={() => {
                onCancel(order)
                onClose()
              }}
              type="button"
            >
              <X size={16} aria-hidden="true" />
              Cancelar pedido
            </button>
          </div>
        )}
      </div>
    </ModalFrame>
  )
}
