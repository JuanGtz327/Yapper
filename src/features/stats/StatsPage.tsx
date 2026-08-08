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
        <label className="period-control">
          <span className="visually-hidden">Periodo de estadísticas</span>
          <CustomSelect
            className="status-select"
            value={period}
            onChange={(val) => setPeriod(val as '7d' | '6m')}
            options={[
              { value: '7d', label: 'Últimos 7 días' },
              { value: '6m', label: 'Últimos 6 meses' },
            ]}
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
      <div className="stats-grid">
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
      <div className="panel insight-panel">
        <h2>Resumen de ventas</h2>
        <div className="big-chart">
          <div className="bars">
            {periodSales.map((item) => (
              <i
                key={item.label}
                title={`${item.label}: ${formatMoney(item.total, currency)}`}
                style={{ height: `${Math.max((item.total / max) * 100, 3)}%` }}
              />
            ))}
          </div>
          <div className="chart-days">
            {periodSales.map((item) => (
              <span key={item.label}>{item.label}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
