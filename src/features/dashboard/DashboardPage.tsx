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
      <section className="relative overflow-hidden flex items-center justify-between min-h-[145px] p-[30px_35px] mb-[22px] rounded-[14px] text-white bg-[#744b78] max-[650px]:p-[25px]">
        <div>
          <span className="block mb-[9px] text-[#dec6dc] text-[10px] font-bold tracking-[1.25px] uppercase">
            RESUMEN DE HOY
          </span>
          <h2 className="relative z-10 text-white text-[25px] mb-[7px]">
            Todo bajo control
          </h2>
          <p className="relative z-10 text-[#e1cedf] text-[13px]">
            Revisa tu negocio y mantén tus pedidos al día.
          </p>
        </div>
        <div
          className="absolute w-[270px] h-[270px] right-[65px] top-[-108px] border border-white/10 rounded-full shadow-[0_0_0_30px_rgba(255,255,255,0.06),0_0_0_60px_rgba(255,255,255,0.03)] max-[650px]:hidden"
          aria-hidden="true"
        />
        <div
          className="relative z-20 flex items-center gap-[18px] pr-[40px] text-[#e5c9df] text-[26px] max-[650px]:hidden"
          aria-hidden="true"
        >
          ✦　•　✧
        </div>
      </section>
      <section className="grid grid-cols-3 gap-4 mb-[22px] max-[650px]:grid-cols-1">
        <Stat
          label="Ventas últimos 7 días"
          value={formatMoney(totalSales, currency)}
          detail={`${salesCount} pedidos guardados`}
          positive
        />
        <Stat
          label="Pedidos pendientes de entrega"
          value={String(pending)}
          detail="Revisa sus entregas"
        />
        <Stat
          label="Productos activos"
          value={String(products.length)}
          detail={`${lowStock} con stock bajo`}
        />
      </section>
      <section className="grid grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)] gap-4 max-[650px]:grid-cols-1">
        <article className="border border-border rounded-[13px] bg-sidebar p-[23px_24px] max-[650px]:min-w-0">
          <PanelHeading
            title="Ventas recientes"
            subtitle="Ingresos reales de los últimos 7 días"
            action="Ver estadísticas"
            onAction={() => onNavigate('Estadísticas')}
          />
          <div className="flex h-[220px] pt-[28px]">
            <div className="flex flex-col justify-between pb-[23px] text-muted-foreground text-[10px]">
              <span>{formatMoney(maxSales, currency)}</span>
              <span>{formatMoney(maxSales / 2, currency)}</span>
              <span>$0</span>
            </div>
            <div className="relative flex-1 ml-[14px]">
              <div className="absolute inset-x-0 top-0 bottom-[23px] flex flex-col justify-between">
                <i className="block border-t border-dashed border-[#ece8e6]" />
                <i className="block border-t border-dashed border-[#ece8e6]" />
                <i className="block border-t border-dashed border-[#ece8e6]" />
              </div>
              <div className="absolute inset-x-0 top-0 bottom-[23px] flex items-end gap-2 pt-2 px-[2px]" aria-label="Ventas por día">
                {sales.length ? (
                  sales.map((item) => (
                    <span
                      key={item.label}
                      title={`${item.label}: ${formatMoney(item.total, currency)}`}
                      className="flex-1 min-w-[4px] rounded-t-[5px] bg-[#c99fca] transition-[height] duration-300"
                      style={{
                        height: `${Math.max((item.total / maxSales) * 100, 3)}%`,
                      }}
                    />
                  ))
                ) : (
                  <Empty text="Aún no hay ventas en este periodo." />
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 flex justify-between text-muted-foreground text-[10px]">
                {sales.map((item) => (
                  <span key={item.label}>{item.label}</span>
                ))}
              </div>
            </div>
          </div>
        </article>
        <article className="border border-border rounded-[13px] bg-sidebar p-[23px_24px] max-[650px]:min-w-0">
          <PanelHeading
            title="Acciones rápidas"
            subtitle="Lo que necesitas hacer hoy"
          />
          <div className="mt-[17px]">
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
