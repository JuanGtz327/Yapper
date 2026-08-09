import {
  useEffect,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { Plus, Search } from 'lucide-react'
import { formatMoney } from '../../lib/format.ts'
import type { Order, Product } from '../../types.ts'
import { OrderTicketModal } from './OrderTicketModal.tsx'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'

export function OrdersPage({
  orders,
  products,
  currency,
  onAdd,
  onEdit,
  onStatusChange,
  onPaymentChange,
  onCancel,
}: {
  orders: Order[]
  products: Product[]
  currency: string
  onAdd: () => void
  onEdit?: (order: Order) => void
  onStatusChange: (order: Order, status: 'pending' | 'delivered') => void
  onPaymentChange: (order: Order, payment: 'pending' | 'paid') => void
  onCancel: (order: Order) => void
}) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [deliveryFilter, setDeliveryFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [orderSearch, setOrderSearch] = useState('')
  useEffect(() => {
    if (!selectedOrder) return
    const updatedOrder = orders.find((order) => order.id === selectedOrder.id)
    if (updatedOrder && updatedOrder !== selectedOrder) {
      setSelectedOrder(updatedOrder)
    }
  }, [orders, selectedOrder])
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
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id
      .toLowerCase()
      .includes(orderSearch.trim().toLowerCase())
    const matchesDelivery =
      deliveryFilter === 'all' ||
      (deliveryFilter === 'pending' && order.status === 'Pendiente') ||
      (deliveryFilter === 'delivered' && order.status === 'Entregado') ||
      (deliveryFilter === 'cancelled' && order.status === 'Cancelado')
    const matchesPayment =
      paymentFilter === 'all' ||
      (paymentFilter === 'paid' &&
        order.status !== 'Cancelado' &&
        order.payment === 'Pagado') ||
      (paymentFilter === 'pending' &&
        order.status !== 'Cancelado' &&
        order.payment === 'Pendiente')
    return matchesSearch && matchesDelivery && matchesPayment
  })
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
      <div className="table-filters" aria-label="Filtros de pedidos">
        <label className="table-filter-search search-box">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Buscar por número de pedido"
            value={orderSearch}
            onChange={(event) => setOrderSearch(event.target.value)}
            placeholder="Buscar número de pedido"
          />
        </label>
        <label>
          Entrega
          <CustomSelect
            value={deliveryFilter}
            onChange={setDeliveryFilter}
            ariaLabel="Filtrar por entrega"
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'pending', label: 'Pendientes' },
              { value: 'delivered', label: 'Entregados' },
              { value: 'cancelled', label: 'Cancelados' },
            ]}
          />
        </label>
        <label>
          Pago
          <CustomSelect
            value={paymentFilter}
            onChange={setPaymentFilter}
            ariaLabel="Filtrar por pago"
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'paid', label: 'Pagados' },
              { value: 'pending', label: 'Pendientes' },
            ]}
          />
        </label>
        <span className="table-filter-count">
          {filteredOrders.length}{' '}
          {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
        </span>
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
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, idx) => (
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
                    <span className="badge danger">Cancelado</span>
                  ) : (
                    <span
                      className={
                        order.status === 'Entregado'
                          ? 'badge success'
                          : 'badge warning'
                      }
                    >
                      {order.status}
                    </span>
                  )}
                </td>
                <td>
                  {order.status === 'Cancelado' ? (
                    <span className="badge danger">Cancelado</span>
                  ) : (
                    <span
                      className={
                        order.payment === 'Pagado'
                          ? 'badge success'
                          : 'badge warning'
                      }
                    >
                      {order.payment}
                    </span>
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
        {filteredOrders.map((order) => (
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
                    ? 'badge danger'
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
            <div className="order-card-statuses">
              <span>
                Entrega <strong>{order.status}</strong>
              </span>
              <span>
                Pago <strong>{order.payment}</strong>
              </span>
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
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          onPaymentChange={onPaymentChange}
          onCancel={onCancel}
        />
      )}
    </section>
  )
}
