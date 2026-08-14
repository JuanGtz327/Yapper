import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { formatMoney } from '../../lib/format.ts'
import type { Order } from '../../types.ts'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Button } from '../../components/ui/Button.tsx'

export function OrdersPage({
  orders,
  currency,
  onAdd,
  onSelectOrder,
}: {
  orders: Order[]
  currency: string
  onAdd: () => void
  onSelectOrder: (order: Order) => void
}) {
  const [deliveryFilter, setDeliveryFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [orderSearch, setOrderSearch] = useState('')

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
        (order.payment === 'Pagado' || order.payment === 'Parcial')) ||
      (paymentFilter === 'pending' &&
        order.status !== 'Cancelado' &&
        order.payment === 'Pendiente')
    return matchesSearch && matchesDelivery && matchesPayment
  })

  return (
    <section className="page-section">
      <div className="section-intro">
        <div>
          <span className="eyebrow">VENTAS</span>
          <h2>Pedidos</h2>
          <p>Consulta y da seguimiento a tus pedidos.</p>
        </div>
        <Button variant="secondary" onClick={onAdd} type="button" icon={<Plus size={17} />}>
          Crear pedido
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-[13px] mb-[23px] max-[650px]:grid-cols-1">
        <div className="p-[17px_19px] border border-border rounded-[11px] bg-sidebar">
          <span className="block text-muted-foreground text-[11px]">Este mes</span>
          <strong className="block mt-2 text-foreground text-[21px]">
            {formatMoney(
              thisMonth.reduce((sum, order) => sum + order.total, 0),
              currency,
            )}
          </strong>
        </div>
        <div className="p-[17px_19px] border border-border rounded-[11px] bg-sidebar">
          <span className="block text-muted-foreground text-[11px]">Pendientes</span>
          <strong className="block mt-2 text-foreground text-[21px]">
            {active.filter((order) => order.status === 'Pendiente').length}
          </strong>
        </div>
        <div className="p-[17px_19px] border border-border rounded-[11px] bg-sidebar">
          <span className="block text-muted-foreground text-[11px]">Por cobrar</span>
          <strong className="block mt-2 text-foreground text-[21px]">
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
        <div className="relative w-full max-w-[300px]">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            className="pl-8"
            aria-label="Buscar por número de pedido"
            value={orderSearch}
            onChange={(event) => setOrderSearch(event.target.value)}
            placeholder="Buscar número de pedido"
          />
        </div>
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
      <div className="table-card max-[650px]:hidden">
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
                className={`cursor-pointer hover:bg-[#fcf9fc] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#c9a3ca] focus-visible:outline-offset-[-3px]${idx % 2 === 1 ? ' zebra-stripe' : ''}`}
                tabIndex={0}
                key={order.id}
                onClick={() => onSelectOrder(order)}
                onKeyDown={(event) => {
                  if (
                    (event.target as HTMLElement).closest(
                      'button, select, input, a',
                    )
                  )
                    return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectOrder(order)
                  }
                }}
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
                          : order.payment === 'Parcial'
                            ? 'badge info'
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
      <div className="hidden max-[650px]:grid max-[650px]:gap-3" aria-label="Pedidos">
        <p className="visually-hidden">
          Selecciona un pedido para ver sus detalles.
        </p>
        {filteredOrders.map((order) => (
          <article
            className="grid gap-[15px] p-[17px] border border-border rounded-[13px] bg-sidebar shadow-[0_5px_18px_rgba(48,39,46,0.03)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#c9a3ca] focus-visible:outline-offset-2"
            tabIndex={0}
            key={order.id}
            onClick={() => onSelectOrder(order)}
            onKeyDown={(event) => {
              if (
                (event.target as HTMLElement).closest(
                  'button, select, input, a',
                )
              )
                return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectOrder(order)
              }
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <strong className="text-foreground">{order.id}</strong>
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
            <div className="flex flex-col gap-1 items-start">
              <strong className="text-foreground text-[14px]">{order.client}</strong>
              <span className="text-muted-foreground text-[11px]">{order.date}</span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
              <span className="text-muted-foreground text-[11px]">{order.items} productos</span>
              <strong className="text-foreground">{formatMoney(order.total, currency)}</strong>
            </div>
            <div className="flex justify-between gap-3 pt-3 border-t border-border text-muted-foreground text-[11px]">
              <span>
                Entrega <strong className="ml-[3px] text-foreground">{order.status}</strong>
              </span>
              <span>
                Pago <strong className="ml-[3px] text-foreground">{order.payment}</strong>
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
