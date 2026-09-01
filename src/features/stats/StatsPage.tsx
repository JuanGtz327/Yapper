import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Stat } from '../../components/ui/Stat.tsx'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
import { SalesChart } from '../../components/ui/SalesChart.tsx'
import { formatMoney } from '../../lib/format.ts'
import { useSalesQuery } from '../../hooks/queries/useSales.ts'

export function StatsPage({
  user,
  currency,
}: {
  user: User | null
  currency: string
}) {
  const [period, setPeriod] = useState<'7d' | '6m'>('7d')
  const {
    data: periodSales = [],
    isLoading,
    error,
  } = useSalesQuery(user, period)
  const total = periodSales.reduce((sum, item) => sum + item.total, 0)
  const totalCost = periodSales.reduce((sum, item) => sum + item.cost, 0)
  const totalProfit = periodSales.reduce((sum, item) => sum + item.profit, 0)
  const count = periodSales.reduce((sum, item) => sum + item.orders, 0)
  return (
    <section className="animate-[page-in_0.25s_ease_both]">
      <div className="flex items-end justify-between mb-[27px] max-[650px]:flex-col max-[650px]:items-start max-[650px]:gap-[17px]">
        <div>
          <h1>Estadísticas</h1>
          <p className="mt-0.5 ml-0.5">
            Una vista clara para tomar mejores decisiones.
          </p>
        </div>
        <label className="inline-flex items-center">
          <span className="sr-only">Periodo de estadísticas</span>
          <CustomSelect
            className="px-2 py-1.5 border border-[#e5dfdf] rounded-[7px] outline-none text-[#716b72] text-[11px] focus:border-[#9d72a0]"
            value={period}
            onChange={(val) => setPeriod(val as '7d' | '6m')}
            options={[
              { value: '7d', label: 'Últimos 7 días' },
              { value: '6m', label: 'Últimos 6 meses' },
            ]}
            ariaLabel="Periodo de estadísticas"
          />
        </label>
      </div>
      {isLoading && (
        <div
          className="-mt-[17px] mb-[18px] px-[13px] py-[10px] border border-[#d9eadf] rounded-[8px] text-[#579078] bg-[#eff9f1] text-[12px]"
          role="status"
        >
          Cargando estadísticas...
        </div>
      )}
      {error && (
        <div
          className="-mt-[17px] mb-[18px] px-[13px] py-[10px] border border-[#efd8d5] rounded-[8px] text-[#aa6259] bg-[#fff3f0] text-[12px]"
          role="alert"
        >
          No pudimos cargar las estadísticas. Inténtalo de nuevo.
        </div>
      )}
      <div className="grid grid-cols-4 gap-4 mb-[22px] max-[650px]:grid-cols-2 max-[400px]:grid-cols-1">
        <Stat
          label="Ingresos del periodo"
          value={formatMoney(total, currency)}
          detail={`${count} pedidos`}
          positive
        />
        <Stat
          label="Ganancia neta"
          value={formatMoney(totalProfit, currency)}
          detail={`${formatMoney(totalCost, currency)} invertidos`}
          positive
        />
        <Stat
          label="Ticket promedio"
          value={formatMoney(count ? total / count : 0, currency)}
          detail="Promedio real del periodo"
          positive
        />
        <Stat
          label="Días con ventas"
          value={String(periodSales.length)}
          detail="Actividad registrada"
        />
      </div>
      <div className="border border-[#ebe8e4] rounded-[13px] bg-[#fffefa] p-[23px_24px] min-h-[300px]">
        <h2>Resumen de ventas</h2>
        <div className="mt-[25px]">
          {periodSales.length ? (
            <SalesChart data={periodSales} currency={currency} />
          ) : (
            <p className="text-sm text-muted-foreground mt-[25px]">
              Aún no hay ventas en este periodo.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
