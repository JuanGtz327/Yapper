import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import type { SalesAggregate } from '../../types.ts'
import { formatMoney } from '../../lib/format.ts'

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
  label?: string
  currency: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[#e8e4e6] bg-white px-3 py-2 shadow-md">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-[12px] text-foreground">
          <span className="font-semibold">{entry.name}:</span>{' '}
          {formatMoney(entry.value, currency)}
        </p>
      ))}
    </div>
  )
}

function LegendFormatter({ value }: { value: string }) {
  return <span className="text-xs text-foreground">{value}</span>
}

export function SalesChart({
  data,
  currency,
}: {
  data: SalesAggregate[]
  currency: string
}) {
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#ece8e6"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#888' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#888' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatMoney(v, currency)}
            width={70}
          />
          <Tooltip
            content={<CustomTooltip currency={currency} />}
            cursor={{ fill: 'rgba(109, 60, 114, 0.06)' }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={LegendFormatter}
          />
          <Bar
            dataKey="total"
            name="Ventas"
            fill="#c99fca"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="cost"
            name="Inversión"
            fill="#f0a87a"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="profit"
            name="Ganancia"
            fill="#7ac08a"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
