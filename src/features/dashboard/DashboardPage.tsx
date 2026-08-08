import { ClipboardList, PackagePlus, Users } from 'lucide-react'
import { formatMoney } from '../../lib/format.ts'
import type { Page } from '../../lib/navigation.ts'
import type { Order, Product, SalesAggregate } from '../../types.ts'
import { Empty } from '../../components/ui/Empty.tsx'
import { PanelHeading } from '../../components/ui/PanelHeading.tsx'
import { QuickAction } from '../../components/ui/QuickAction.tsx'
import { Stat } from '../../components/ui/Stat.tsx'

export function DashboardPage({
  orders,
  products,
  sales,
  threshold,
  currency,
  onNavigate,
}: {
  orders: Order[]
  products: Product[]
  sales: SalesAggregate[]
  threshold: number
  currency: string
  onNavigate: (page: Page) => void
}) {
  const activeOrders = orders.filter((order) => order.status !== 'Cancelado')
  const totalSales = sales.reduce((sum, item) => sum + item.total, 0)
  const salesCount = sales.reduce((sum, item) => sum + item.orders, 0)
  const pending = activeOrders.filter(
    (order) => order.status === 'Pendiente',
  ).length
  const lowStock = products.filter((product) =>
    product.variants.some((v) => v.stock <= threshold),
  ).length
  const maxSales = Math.max(...sales.map((item) => item.total), 1)
  return (
    <>
      <section className="welcome-card">
        <div>
          <span className="welcome-tag">RESUMEN DE HOY</span>
          <h2>Todo bajo control</h2>
          <p>Revisa tu negocio y mantén tus pedidos al día.</p>
        </div>
        <div className="welcome-decoration" aria-hidden="true">
          ✦　•　✧
        </div>
      </section>
      <section className="stats-grid">
        <Stat
          label="Ventas últimos 7 días"
          value={formatMoney(totalSales, currency)}
          detail={`${salesCount} pedidos guardados`}
          positive
        />
        <Stat
          label="Pedidos pendientes"
          value={String(pending)}
          detail="Revisa sus entregas"
        />
        <Stat
          label="Productos activos"
          value={String(products.length)}
          detail={`${lowStock} con stock bajo`}
        />
      </section>
      <section className="content-grid">
        <article className="panel sales-panel">
          <PanelHeading
            title="Ventas recientes"
            subtitle="Ingresos reales de los últimos 7 días"
            action="Ver estadísticas"
            onAction={() => onNavigate('Estadísticas')}
          />
          <div className="chart-placeholder">
            <div className="chart-y-axis">
              <span>{formatMoney(maxSales, currency)}</span>
              <span>{formatMoney(maxSales / 2, currency)}</span>
              <span>$0</span>
            </div>
            <div className="chart-area">
              <div className="chart-lines">
                <i />
                <i />
                <i />
              </div>
              <div className="bar-chart" aria-label="Ventas por día">
                {sales.length ? (
                  sales.map((item) => (
                    <span
                      key={item.label}
                      title={`${item.label}: ${formatMoney(item.total, currency)}`}
                      style={{
                        height: `${Math.max((item.total / maxSales) * 100, 3)}%`,
                      }}
                    />
                  ))
                ) : (
                  <Empty text="Aún no hay ventas en este periodo." />
                )}
              </div>
              <div className="chart-days">
                {sales.map((item) => (
                  <span key={item.label}>{item.label}</span>
                ))}
              </div>
            </div>
          </div>
        </article>
        <article className="panel quick-panel">
          <PanelHeading
            title="Acciones rápidas"
            subtitle="Lo que necesitas hacer hoy"
          />
          <div className="quick-actions">
            <QuickAction
              icon={<ClipboardList size={19} />}
              color="peach"
              title="Nuevo pedido"
              detail="Registra una venta"
              onClick={() => onNavigate('Pedidos')}
            />
            <QuickAction
              icon={<PackagePlus size={19} />}
              color="mint"
              title="Añadir producto"
              detail="Actualiza tu almacén"
              onClick={() => onNavigate('Almacén')}
            />
            <QuickAction
              icon={<Users size={19} />}
              color="lavender"
              title="Nuevo cliente"
              detail="Guarda sus datos"
              onClick={() => onNavigate('Clientes')}
            />
          </div>
        </article>
      </section>
    </>
  )
}
