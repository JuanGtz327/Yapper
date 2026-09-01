import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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
  payload?: Array<{ value: number }>
  label?: string
  currency: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[#e8e4e6] bg-white px-3 py-2 shadow-md">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {formatMoney(payload[0].value, currency)}
      </p>
    </div>
  )
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
          <Bar
            dataKey="total"
            fill="#c99fca"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
