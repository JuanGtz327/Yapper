import {
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type SyntheticEvent,
} from 'react'
import { Plus, X } from 'lucide-react'
import { formatMoney } from '../../lib/format.ts'
import type { Order, Product } from '../../types.ts'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
import { Button } from '../../components/ui/Button.tsx'
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
            {orders.map((order, idx) => (
              <tr
                className={`order-row${idx % 2 === 1 ? ' zebra-stripe' : ''}`}
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
                    <CustomSelect
                      ariaLabel={`Entrega de ${order.id}`}
                      className="status-select"
                      value={
                        order.status === 'Entregado' ? 'delivered' : 'pending'
                      }
                      options={[
                        { value: 'pending', label: 'Pendiente' },
                        { value: 'delivered', label: 'Entregado' },
                      ]}
                      onChange={(val) => {
                        onStatusChange(
                          order,
                          val as 'pending' | 'delivered',
                        )
                      }}
                    />
                  )}
                </td>
                <td>
                  {order.status === 'Cancelado' ? (
                    <span className="badge warning">Cancelado</span>
                  ) : (
                    <CustomSelect
                      ariaLabel={`Pago de ${order.id}`}
                      className="status-select"
                      value={order.payment === 'Pagado' ? 'paid' : 'pending'}
                      options={[
                        { value: 'paid', label: 'Pagado' },
                        { value: 'pending', label: 'Pendiente' },
                      ]}
                      onChange={(val) => {
                        onPaymentChange(
                          order,
                          val as 'pending' | 'paid',
                        )
                      }}
                    />
                  )}
                </td>
                <td>
                  {order.status !== 'Cancelado' && (
                    <Button
                      variant="danger"
                      icon={<X size={16} aria-hidden="true" />}
                      onClick={(event) => {
                        stopRowInteraction(event)
                        onCancel(order)
                      }}
                      aria-label={`Cancelar ${order.id}`}
                      type="button"
                    />
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
                    <CustomSelect
                      ariaLabel={`Entrega de ${order.id}`}
                      className="status-select"
                      value={
                        order.status === 'Entregado' ? 'delivered' : 'pending'
                      }
                      options={[
                        { value: 'pending', label: 'Pendiente' },
                        { value: 'delivered', label: 'Entregado' },
                      ]}
                      onChange={(val) => {
                        onStatusChange(
                          order,
                          val as 'pending' | 'delivered',
                        )
                      }}
                    />
                  </label>
                  <label>
                    Pago
                    <CustomSelect
                      ariaLabel={`Pago de ${order.id}`}
                      className="status-select"
                      value={order.payment === 'Pagado' ? 'paid' : 'pending'}
                      options={[
                        { value: 'paid', label: 'Pagado' },
                        { value: 'pending', label: 'Pendiente' },
                      ]}
                      onChange={(val) => {
                        onPaymentChange(
                          order,
                          val as 'pending' | 'paid',
                        )
                      }}
                    />
                  </label>
                </>
              )}
              {order.status !== 'Cancelado' && (
                <Button
                  variant="danger"
                  icon={<X size={16} aria-hidden="true" />}
                  onClick={(event) => {
                    stopRowInteraction(event)
                    onCancel(order)
                  }}
                  aria-label={`Cancelar ${order.id}`}
                  type="button"
                />
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
