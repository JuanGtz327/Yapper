import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { formatMoney } from '../../lib/format.ts'
import { cn } from '../../lib/utils.ts'
import { Badge } from '../../components/ui/badge.tsx'
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
      <div className="flex items-end gap-[10px] mb-[14px] max-[650px]:flex-col max-[650px]:items-stretch" aria-label="Filtros de pedidos">
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
        <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold max-[650px]:w-full max-[650px]:min-w-0">
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
        <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold max-[650px]:w-full max-[650px]:min-w-0">
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
        <span className="ml-auto pb-[10px] text-[#aaa5a8] text-[10px] max-[650px]:ml-0 max-[650px]:pb-0">
          {filteredOrders.length}{' '}
          {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
        </span>
      </div>
      <div className="overflow-auto border border-[#ebe8e4] rounded-[13px] bg-[#fffefa] max-[650px]:hidden">
        <table className="w-full border-collapse min-w-[650px] text-xs">
          <caption className="sr-only">
            Lista de pedidos. Selecciona un pedido para ver sus detalles.
          </caption>
          <thead>
            <tr className="bg-[#6d3c72]">
              <th className="px-[14px] py-[14px] text-white text-[10px] font-bold text-center uppercase tracking-[0.7px] rounded-tl-[12px]">Pedido</th>
              <th className="px-[14px] py-[14px] text-white text-[10px] font-bold text-center uppercase tracking-[0.7px]">Cliente</th>
              <th className="px-[14px] py-[14px] text-white text-[10px] font-bold text-center uppercase tracking-[0.7px]">Fecha</th>
              <th className="px-[14px] py-[14px] text-white text-[10px] font-bold text-center uppercase tracking-[0.7px]">Total</th>
              <th className="px-[14px] py-[14px] text-white text-[10px] font-bold text-center uppercase tracking-[0.7px]">Entrega</th>
              <th className="px-[14px] py-[14px] text-white text-[10px] font-bold text-center uppercase tracking-[0.7px] rounded-tr-[12px]">Pago</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, idx) => (
              <tr
                className={cn(
                  'py-[15px] px-[18px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle cursor-pointer hover:bg-[#fcf9fc] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#c9a3ca] focus-visible:outline-offset-[-3px]',
                  idx % 2 === 1 ? 'bg-[#f9f6fa]' : '',
                )}
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
                <td className="px-[14px] py-[14px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle text-ink font-bold text-right">{order.id}</td>
                <td className="px-[14px] py-[14px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle">
                  <strong>{order.client}</strong>
                  <small className="block mt-[3px] text-[#aaa5a8] text-[10px]">{order.items} productos</small>
                </td>
                <td className="px-[14px] py-[14px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle">{order.date}</td>
                <td className="px-[14px] py-[14px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle text-ink font-bold text-right">
                  {formatMoney(order.total, currency)}
                </td>
                <td className="px-[14px] py-[14px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle">
                  {order.status === 'Cancelado' ? (
                    <Badge variant="danger">Cancelado</Badge>
                  ) : (
                    <Badge variant={order.status === 'Entregado' ? 'success' : 'warning'}>
                      {order.status}
                    </Badge>
                  )}
                </td>
                <td className="px-[14px] py-[14px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle">
                  {order.status === 'Cancelado' ? (
                    <Badge variant="danger">Cancelado</Badge>
                  ) : (
                    <Badge
                      variant={
                        order.payment === 'Pagado'
                          ? 'success'
                          : order.payment === 'Parcial'
                            ? 'info'
                            : 'warning'
                      }
                    >
                      {order.payment}
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hidden max-[650px]:grid max-[650px]:gap-3" aria-label="Pedidos">
        <p className="sr-only">
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
              <Badge
                variant={
                  order.status === 'Cancelado'
                    ? 'danger'
                    : order.status === 'Entregado'
                      ? 'success'
                      : 'warning'
                }
              >
                {order.status}
              </Badge>
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
