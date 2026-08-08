import {
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type SyntheticEvent,
} from 'react'
import { Plus, X } from 'lucide-react'
import { formatMoney } from '../../lib/format.ts'
import type { Order, Product } from '../../types.ts'
import { OrderTicketModal } from './OrderTicketModal.tsx'

export function OrdersPage({
  orders,
  products,
  currency,
  onAdd,
  onStatusChange,
  onPaymentChange,
  onCancel,
}: {
  orders: Order[]
  products: Product[]
  currency: string
  onAdd: () => void
  onStatusChange: (order: Order, status: 'pending' | 'delivered') => void
  onPaymentChange: (order: Order, payment: 'pending' | 'paid') => void
  onCancel: (order: Order) => void
}) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const now = new Date()
  const active = orders.filter((order) => order.status !== 'Cancelado')
  const thisMonth = active.filter((order) => {
    if (!order.createdAt) return true
    const orderDate = new Date(order.createdAt)
    return (
      orderDate.getFullYear() === now.getFullYear() &&
      orderDate.getMonth() === now.getMonth()
    )
  })
  const openOrder = (order: Order) => setSelectedOrder(order)
  const handleRowKeyDown = (
    event: ReactKeyboardEvent<HTMLTableRowElement>,
    order: Order,
  ) => {
    if ((event.target as HTMLElement).closest('button, select, input, a'))
      return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openOrder(order)
    }
  }
  const stopRowInteraction = (event: SyntheticEvent) => event.stopPropagation()
  return (
    <section className="page-section">
      <div className="section-intro">
        <div>
          <span className="eyebrow">VENTAS</span>
          <h2>Pedidos</h2>
          <p>Consulta y da seguimiento a tus pedidos.</p>
        </div>
        <button className="secondary-button" onClick={onAdd} type="button">
          <Plus size={17} />
          Crear pedido
        </button>
      </div>
      <div className="order-summary">
        <div>
          <span>Este mes</span>
          <strong>
            {formatMoney(
              thisMonth.reduce((sum, order) => sum + order.total, 0),
              currency,
            )}
          </strong>
        </div>
        <div>
          <span>Pendientes</span>
          <strong>
            {active.filter((order) => order.status === 'Pendiente').length}
          </strong>
        </div>
        <div>
          <span>Por cobrar</span>
          <strong>
            {formatMoney(
              active
                .filter((order) => order.payment === 'Pendiente')
                .reduce((sum, order) => sum + order.total, 0),
              currency,
            )}
          </strong>
        </div>
      </div>
      <div className="table-card orders-table">
        <table>
          <caption className="visually-hidden">
            Lista de pedidos. Selecciona un pedido para ver sus detalles.
          </caption>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Entrega</th>
              <th>Pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                className="order-row"
                tabIndex={0}
                key={order.id}
                onClick={() => openOrder(order)}
                onKeyDown={(event) => handleRowKeyDown(event, order)}
              >
                <td className="table-emphasis">{order.id}</td>
                <td>
                  <strong>{order.client}</strong>
                  <small className="table-sub">{order.items} productos</small>
                </td>
                <td>{order.date}</td>
                <td className="table-emphasis">
                  {formatMoney(order.total, currency)}
                </td>
                <td>
                  {order.status === 'Cancelado' ? (
                    <span className="badge warning">Cancelado</span>
                  ) : (
                    <select
                      aria-label={`Entrega de ${order.id}`}
                      className="status-select"
                      value={
                        order.status === 'Entregado' ? 'delivered' : 'pending'
                      }
                      onClick={stopRowInteraction}
                      onKeyDown={stopRowInteraction}
                      onChange={(event) => {
                        stopRowInteraction(event)
                        onStatusChange(
                          order,
                          event.target.value as 'pending' | 'delivered',
                        )
                      }}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="delivered">Entregado</option>
                    </select>
                  )}
                </td>
                <td>
                  {order.status === 'Cancelado' ? (
                    <span className="badge warning">Cancelado</span>
                  ) : (
                    <select
                      aria-label={`Pago de ${order.id}`}
                      className="status-select"
                      value={order.payment === 'Pagado' ? 'paid' : 'pending'}
                      onClick={stopRowInteraction}
                      onKeyDown={stopRowInteraction}
                      onChange={(event) => {
                        stopRowInteraction(event)
                        onPaymentChange(
                          order,
                          event.target.value as 'pending' | 'paid',
                        )
                      }}
                    >
                      <option value="paid">Pagado</option>
                      <option value="pending">Pendiente</option>
                    </select>
                  )}
                </td>
                <td>
                  {order.status !== 'Cancelado' && (
                    <button
                      className="icon-button danger"
                      onClick={(event) => {
                        stopRowInteraction(event)
                        onCancel(order)
                      }}
                      aria-label={`Cancelar ${order.id}`}
                      type="button"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="orders-cards" aria-label="Pedidos">
        <p className="visually-hidden">
          Selecciona un pedido para ver sus detalles.
        </p>
        {orders.map((order) => (
          <article
            className="order-card"
            tabIndex={0}
            key={order.id}
            onClick={() => openOrder(order)}
            onKeyDown={(event) => {
              if (
                (event.target as HTMLElement).closest(
                  'button, select, input, a',
                )
              )
                return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openOrder(order)
              }
            }}
          >
            <div className="order-card-heading">
              <strong>{order.id}</strong>
              <span
                className={
                  order.status === 'Cancelado'
                    ? 'badge warning'
                    : order.status === 'Entregado'
                      ? 'badge success'
                      : 'badge warning'
                }
              >
                {order.status}
              </span>
            </div>
            <div className="order-card-client">
              <strong>{order.client}</strong>
              <span>{order.date}</span>
            </div>
            <div className="order-card-meta">
              <span>{order.items} productos</span>
              <strong>{formatMoney(order.total, currency)}</strong>
            </div>
            <div className="order-card-actions">
              {order.status === 'Cancelado' ? (
                <>
                  <span className="badge warning">Entrega cancelada</span>
                  <span className="badge warning">Pago cancelado</span>
                </>
              ) : (
                <>
                  <label>
                    Entrega
                    <select
                      aria-label={`Entrega de ${order.id}`}
                      className="status-select"
                      value={order.status === 'Entregado' ? 'delivered' : 'pending'}
                      onClick={stopRowInteraction}
                      onKeyDown={stopRowInteraction}
                      onChange={(event) => {
                        stopRowInteraction(event)
                        onStatusChange(
                          order,
                          event.target.value as 'pending' | 'delivered',
                        )
                      }}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="delivered">Entregado</option>
                    </select>
                  </label>
                  <label>
                    Pago
                    <select
                      aria-label={`Pago de ${order.id}`}
                      className="status-select"
                      value={order.payment === 'Pagado' ? 'paid' : 'pending'}
                      onClick={stopRowInteraction}
                      onKeyDown={stopRowInteraction}
                      onChange={(event) => {
                        stopRowInteraction(event)
                        onPaymentChange(
                          order,
                          event.target.value as 'pending' | 'paid',
                        )
                      }}
                    >
                      <option value="paid">Pagado</option>
                      <option value="pending">Pendiente</option>
                    </select>
                  </label>
                </>
              )}
              {order.status !== 'Cancelado' && (
                <button
                  className="icon-button danger"
                  onClick={(event) => {
                    stopRowInteraction(event)
                    onCancel(order)
                  }}
                  aria-label={`Cancelar ${order.id}`}
                  type="button"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {selectedOrder && (
        <OrderTicketModal
          order={selectedOrder}
          products={products}
          currency={currency}
          onClose={() => setSelectedOrder(null)}
          onCancel={onCancel}
        />
      )}
    </section>
  )
}
