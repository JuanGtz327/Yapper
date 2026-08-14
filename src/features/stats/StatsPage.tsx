import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Stat } from '../../components/ui/Stat.tsx'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
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
  const count = periodSales.reduce((sum, item) => sum + item.orders, 0)
  const max = Math.max(...periodSales.map((item) => item.total), 1)
  return (
    <section className="page-section">
      <div className="section-intro">
        <div>
          <span className="eyebrow">ANÁLISIS DEL NEGOCIO</span>
          <h2>Estadísticas</h2>
          <p>Una vista clara para tomar mejores decisiones.</p>
        </div>
        <label className="inline-flex items-center">
          <span className="sr-only">Periodo de estadísticas</span>
          <CustomSelect
            className="px-2 py-1.5 border border-[#e5dfdf] rounded-[7px] outline-none text-[#716b72] bg-[#fffefa] text-[11px] focus:border-[#9d72a0]"
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
        <div className="data-notice" role="status">
          Cargando estadísticas...
        </div>
      )}
      {error && (
        <div className="data-notice error" role="alert">
          No pudimos cargar las estadísticas. Inténtalo de nuevo.
        </div>
      )}
      <div className="grid grid-cols-3 gap-4 mb-[22px] max-[650px]:grid-cols-1">
        <Stat
          label="Ingresos del periodo"
          value={formatMoney(total, currency)}
          detail={`${count} pedidos`}
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
      <div className="panel min-h-[300px]">
        <h2>Resumen de ventas</h2>
        <div className="relative h-[220px] mt-[25px] border-b border-[#ebe8e4]">
          <div className="stats-bars">
            {periodSales.map((item) => (
              <i
                key={item.label}
                title={`${item.label}: ${formatMoney(item.total, currency)}`}
                style={{ height: `${Math.max((item.total / max) * 100, 3)}%` }}
              />
            ))}
          </div>
          <div className="absolute bottom-[-22px] left-0 right-0 flex justify-around px-5 text-[10px] text-muted-foreground">
            {periodSales.map((item) => (
              <span key={item.label}>{item.label}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
