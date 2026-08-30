import { useState } from 'react'
import { ArrowLeft, PackagePlus, Search } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import type { VariantPriceHistory } from '../../types.ts'
import { Button } from '../../components/ui/Button.tsx'
import { Badge } from '../../components/ui/badge.tsx'
import { formatMoney } from '../../lib/format.ts'
import { qk } from '../../lib/queryKeys.ts'
import { restockVariant } from '../../lib/repository.ts'
import { useProductDetail } from '../../hooks/queries/useProductDetail.ts'
import { RestockModal } from './RestockModal.tsx'
import type { User } from '@supabase/supabase-js'

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function summaryFromHistory(history: VariantPriceHistory[]) {
  if (history.length === 0) {
    return {
      latest: null,
      oldest: null,
      priceChange: null,
      costChange: null,
    }
  }
  const sorted = [...history].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
  )
  const latest = sorted[0]
  const oldest = sorted[sorted.length - 1]
  return {
    latest,
    oldest,
    priceChange: latest.salePrice - oldest.salePrice,
    costChange: latest.inventoryCost - oldest.inventoryCost,
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function ProductDetailPage({
  user,
  productId,
  currency,
  onBack,
  onEdit,
}: {
  user: User | null
  productId: string
  currency: string
  onBack: () => void
  onEdit: () => void
}) {
  const [metric, setMetric] = useState<'price' | 'cost'>('price')
  const [variantSearch, setVariantSearch] = useState('')
  const [restockModalOpen, setRestockModalOpen] = useState(false)

  const {
    product,
    productLoading,
    selectedVariantId,
    setSelectedVariantId,
    priceHistory,
    priceHistoryLoading,
    restockHistory,
    restockHistoryLoading,
    periodFrom,
    periodTo,
    setPeriodRange,
  } = useProductDetail(user, productId)

  const qc = useQueryClient()

  if (productLoading) {
    return (
      <section className="animate-[page-in_0.25s_ease_both]">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 border-[3px] border-primary border-r-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground text-sm">
              Cargando producto…
            </span>
          </div>
        </div>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="animate-[page-in_0.25s_ease_both]">
        <div className="mb-6">
          <Button
            variant="secondary"
            type="button"
            icon={<ArrowLeft size={16} aria-hidden="true" />}
            onClick={onBack}
          >
            Volver
          </Button>
        </div>
        <p className="text-muted-foreground">No encontramos este producto.</p>
      </section>
    )
  }

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants[0] ??
    null

  const summary = summaryFromHistory(priceHistory)

  const metricValues = {
    current: selectedVariant
      ? metric === 'price'
        ? selectedVariant.salePrice
        : selectedVariant.inventoryCost
      : null,
    latest: summary.latest
      ? metric === 'price'
        ? summary.latest.salePrice
        : summary.latest.inventoryCost
      : null,
    oldest: summary.oldest
      ? metric === 'price'
        ? summary.oldest.salePrice
        : summary.oldest.inventoryCost
      : null,
  }

  const avg =
    priceHistory.length > 0
      ? priceHistory.reduce(
          (sum, e) =>
            sum + (metric === 'price' ? e.salePrice : e.inventoryCost),
          0,
        ) / priceHistory.length
      : null

  const suggested = (() => {
    if (!selectedVariant) return null
    return selectedVariant.inventoryCost * 1.3
  })()

  const absoluteChange =
    metricValues.latest !== null && metricValues.oldest !== null
      ? metricValues.latest - metricValues.oldest
      : null

  const percentChange =
    absoluteChange !== null && metricValues.oldest
      ? (absoluteChange / metricValues.oldest) * 100
      : null

  return (
    <section className="min-w-0 animate-[page-in_0.25s_ease_both]">
      <div className="flex items-end justify-between gap-4 mb-[27px] max-[650px]:flex-col max-[650px]:items-start max-[650px]:gap-[17px]">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Detalle del producto, variantes y evolución de precios.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 max-[650px]:w-full">
          <Button
            variant="secondary"
            type="button"
            icon={<ArrowLeft size={16} aria-hidden="true" />}
            onClick={onBack}
          >
            Volver
          </Button>
          <Button variant="secondary" type="button" onClick={onEdit}>
            Editar producto
          </Button>
        </div>
      </div>

      {/* Row 1: Información (30%) + Resumen de precios (70%) */}
      <div className="grid min-w-0 grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)] gap-4 mb-4 max-[850px]:grid-cols-1">
        <div className="min-w-0 border border-[#ebe8e4] rounded-[13px] bg-[#fffefa] p-5">
          <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72] mb-4">
            INFORMACIÓN DEL PRODUCTO
          </span>
          <div className="grid gap-3 text-sm text-foreground">
            <div>
              <span className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.6px]">
                Categoría
              </span>
              <p className="mt-1">{product.category || 'Sin categoría'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.6px]">
                Descripción
              </span>
              <p className="mt-1 whitespace-pre-wrap">
                {product.publicDescription || 'Sin descripción pública.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={product.published ? 'success' : 'secondary'}>
                {product.published ? 'Publicado' : 'Borrador'}
              </Badge>
              <Badge variant="outline">
                {product.variants.length} variante
                {product.variants.length === 1 ? '' : 's'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="min-w-0 border border-[#ebe8e4] rounded-[13px] bg-[#fffefa] p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
              RESUMEN DE PRECIOS
            </span>
            <div className="flex rounded-[8px] border border-[#e8e4e6] overflow-hidden text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setMetric('price')}
                className={`px-3 py-1 transition-colors ${
                  metric === 'price'
                    ? 'bg-[#6d3c72] text-white'
                    : 'bg-white text-muted-foreground hover:bg-[#f7f2f9]'
                }`}
              >
                Precio
              </button>
              <button
                type="button"
                onClick={() => setMetric('cost')}
                className={`px-3 py-1 transition-colors ${
                  metric === 'cost'
                    ? 'bg-[#6d3c72] text-white'
                    : 'bg-white text-muted-foreground hover:bg-[#f7f2f9]'
                }`}
              >
                Costo
              </button>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="grid grid-cols-3 gap-3 max-[600px]:grid-cols-1">
              <div className="border border-[#e8e4e6] rounded-[10px] p-3 bg-white">
                <span className="text-[11px] font-bold uppercase tracking-[0.6px] text-muted-foreground">
                  Anterior
                </span>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {metricValues.oldest !== null
                    ? formatMoney(metricValues.oldest, currency)
                    : '—'}
                </p>
              </div>
              <div className="border border-[#e8e4e6] rounded-[10px] p-3 bg-primary text-primary-foreground">
                <span className="text-[11px] font-bold uppercase tracking-[0.6px] opacity-80">
                  {metric === 'price' ? 'Precio actual' : 'Costo actual'}
                </span>
                <p className="text-lg font-semibold mt-1">
                  {metricValues.current !== null
                    ? formatMoney(metricValues.current, currency)
                    : '—'}
                </p>
              </div>
              <div className="border border-[#e8e4e6] rounded-[10px] p-3 bg-white">
                <span className="text-[11px] font-bold uppercase tracking-[0.6px] text-muted-foreground">
                  Promedio
                </span>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {avg !== null ? formatMoney(avg, currency) : '—'}
                </p>
              </div>
            </div>

            {metric === 'price' && (
              <div className="border border-[#e8e4e6] rounded-[10px] p-3 bg-[#f9f6fa]">
                <span className="text-[11px] font-bold uppercase tracking-[0.6px] text-muted-foreground">
                  Sugerido para ganancia base
                </span>
                <p className="text-sm text-foreground mt-1">
                  {suggested !== null
                    ? `Costo + 30%: ${formatMoney(suggested, currency)}`
                    : '—'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 max-[500px]:grid-cols-1">
              <div className="border border-[#e8e4e6] rounded-[10px] p-3 bg-white">
                <span className="text-[11px] font-bold uppercase tracking-[0.6px] text-muted-foreground">
                  Variación absoluta
                </span>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {absoluteChange !== null
                    ? `${absoluteChange >= 0 ? '+' : ''}${formatMoney(absoluteChange, currency)}`
                    : '—'}
                </p>
              </div>
              <div className="border border-[#e8e4e6] rounded-[10px] p-3 bg-white">
                <span className="text-[11px] font-bold uppercase tracking-[0.6px] text-muted-foreground">
                  Variación porcentual
                </span>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {formatPercent(percentChange)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Variantes (30%) + Gráficas (70%) */}
      <div className="grid min-w-0 grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)] gap-4 mb-4 max-[850px]:grid-cols-1">
        <div className="min-w-0 border border-[#ebe8e4] rounded-[13px] bg-[#fffefa] p-5">
          <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72] mb-3">
            VARIANTES
          </span>
          <div className="relative mb-3">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar variante…"
              value={variantSearch}
              onChange={(e) => setVariantSearch(e.target.value)}
              className="w-full border border-[#e8e4e6] rounded-[10px] pl-8 pr-3 py-2 text-sm bg-white placeholder:text-muted-foreground focus:outline-none focus:border-[#6d3c72] transition-colors"
            />
          </div>
          {selectedVariant && (
            <Button
              variant="secondary"
              type="button"
              icon={<PackagePlus size={15} aria-hidden="true" />}
              className="mb-3 w-full"
              onClick={() => setRestockModalOpen(true)}
            >
              Registrar compra
            </Button>
          )}
          <div className="grid gap-3 max-h-[320px] overflow-y-auto pr-1">
            {product.variants.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Este producto aún no tiene variantes registradas.
              </p>
            )}
            {product.variants
              .filter((v) => {
                if (!variantSearch) return true
                const q = variantSearch.toLowerCase()
                return (
                  (v.sku && v.sku.toLowerCase().includes(q)) ||
                  (v.name && v.name.toLowerCase().includes(q))
                )
              })
              .map((variant) => {
                const isSelected = variant.id === selectedVariantId
                const margin = variant.salePrice
                  ? ((variant.salePrice - variant.inventoryCost) /
                      variant.salePrice) *
                    100
                  : 0
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`text-left border rounded-[10px] p-[12px_14px] transition-colors ${
                      isSelected
                        ? 'border-[#6d3c72] bg-[#f7f2f9]'
                        : 'border-[#e8e4e6] bg-white hover:bg-[#f9f6fa]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <strong className="text-[13px] text-foreground block truncate">
                          {variant.sku || 'Sin SKU'}
                        </strong>
                        <span className="text-[12px] text-muted-foreground">
                          {variant.name || 'Variante'} · {variant.stock} uds
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[13px] font-semibold text-foreground">
                          {formatMoney(variant.salePrice, currency)}
                        </span>
                        <span className="block text-[11px] text-muted-foreground mt-1">
                          Margen {margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {variant.optionValues.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {variant.optionValues.map((ov, idx) => (
                          <Badge
                            key={`${variant.id}-${idx}`}
                            variant="secondary"
                          >
                            {ov.optionType}: {ov.value}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            {product.variants.length > 0 &&
              product.variants.filter((v) => {
                if (!variantSearch) return true
                const q = variantSearch.toLowerCase()
                return (
                  (v.sku && v.sku.toLowerCase().includes(q)) ||
                  (v.name && v.name.toLowerCase().includes(q))
                )
              }).length === 0 && (
                <p className="text-muted-foreground text-sm">
                  Sin resultados para "{variantSearch}"
                </p>
              )}
          </div>
        </div>

        <div className="min-w-0 border border-[#ebe8e4] rounded-[13px] bg-[#fffefa] p-5">
          <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72] mb-4">
            GRÁFICAS
          </span>
          {priceHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin datos para graficar.
            </p>
          ) : (
            <div className="py-2 h-[280px] max-[850px]:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[...priceHistory]
                    .sort(
                      (a, b) =>
                        new Date(a.changedAt).getTime() -
                        new Date(b.changedAt).getTime(),
                    )
                    .map((e) => ({
                      fecha: new Date(e.changedAt).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                      precio: e.salePrice,
                      costo: e.inventoryCost,
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e4e6" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 10, fill: '#888' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#888' }}
                    width={50}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatMoney(Number(value), currency),
                      String(name),
                    ]}
                    labelFormatter={(label) => `Fecha: ${label}`}
                    itemStyle={{ fontWeight: 600 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-foreground">{value}</span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="precio"
                    stroke="#6d3c72"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#6d3c72' }}
                    name="Precio"
                  />
                  <Line
                    type="monotone"
                    dataKey="costo"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#a78bfa' }}
                    name="Costo"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Histórico de precios — full width */}
      <div className="min-w-0 border border-[#ebe8e4] rounded-[13px] bg-[#fffefa] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
            HISTÓRICO DE PRECIOS
          </span>
          <div className="flex flex-wrap items-center gap-2 max-[650px]:w-full">
            <label className="text-[11px] font-bold text-muted-foreground max-[650px]:flex-1">
              Desde
              <input
                type="date"
                className="ml-2 max-w-full border border-[#e8e4e6] rounded-md px-2 py-1 text-xs max-[650px]:w-[calc(100%-3.5rem)] appearance-none [-webkit-appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-100"
                value={periodFrom ?? ''}
                onChange={(e) =>
                  setPeriodRange(e.target.value || null, periodTo)
                }
              />
            </label>
            <label className="text-[11px] font-bold text-muted-foreground max-[650px]:flex-1">
              Hasta
              <input
                type="date"
                className="ml-2 max-w-full border border-[#e8e4e6] rounded-md px-2 py-1 text-xs max-[650px]:w-[calc(100%-3.5rem)] appearance-none [-webkit-appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-100"
                value={periodTo ?? ''}
                onChange={(e) =>
                  setPeriodRange(periodFrom, e.target.value || null)
                }
              />
            </label>
          </div>
        </div>

        {priceHistoryLoading ? (
          <p className="text-sm text-muted-foreground">Cargando histórico…</p>
        ) : priceHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay cambios registrados para esta variante.
          </p>
        ) : (
          <div className="max-w-full overflow-x-auto border border-[#ebe8e4] rounded-[10px] bg-white">
            <table className="w-full text-xs border-collapse min-w-[540px]">
              <thead>
                <tr className="bg-[#f7f2f9] text-left">
                  <th className="px-3 py-2 font-semibold text-muted-foreground">
                    Fecha
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground">
                    SKU
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground">
                    Variante
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground text-right">
                    Precio
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground text-right">
                    Costo
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground text-right">
                    Margen
                  </th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.map((entry) => {
                  const margin = entry.salePrice
                    ? ((entry.salePrice - entry.inventoryCost) /
                        entry.salePrice) *
                      100
                    : 0
                  return (
                    <tr key={entry.id} className="border-t border-[#f0eeec]">
                      <td className="px-3 py-2 text-foreground whitespace-nowrap">
                        {formatDateTime(entry.changedAt)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {entry.sku || '—'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {entry.variantName || '—'}
                      </td>
                      <td className="px-3 py-2 text-foreground text-right font-medium">
                        {formatMoney(entry.salePrice, currency)}
                      </td>
                      <td className="px-3 py-2 text-foreground text-right">
                        {formatMoney(entry.inventoryCost, currency)}
                      </td>
                      <td className="px-3 py-2 text-foreground text-right">
                        {margin.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 4: Histórico de compras — full width */}
      <div className="min-w-0 border border-[#ebe8e4] rounded-[13px] bg-[#fffefa] p-5 mt-4">
        <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72] mb-4">
          HISTORIAL DE COMPRAS
        </span>

        {restockHistoryLoading ? (
          <p className="text-sm text-muted-foreground">Cargando historial…</p>
        ) : restockHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay compras registradas para esta variante.
          </p>
        ) : (
          <div className="max-w-full overflow-x-auto border border-[#ebe8e4] rounded-[10px] bg-white">
            <table className="w-full text-xs border-collapse min-w-[480px]">
              <thead>
                <tr className="bg-[#f7f2f9] text-left">
                  <th className="px-3 py-2 font-semibold text-muted-foreground">
                    Fecha
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground">
                    SKU
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground">
                    Variante
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground text-right">
                    Cantidad
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground text-right">
                    Costo unitario
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {restockHistory.map((entry) => (
                  <tr key={entry.id} className="border-t border-[#f0eeec]">
                    <td className="px-3 py-2 text-foreground whitespace-nowrap">
                      {formatDateTime(entry.restockedAt)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {entry.sku || '—'}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {entry.variantName || '—'}
                    </td>
                    <td className="px-3 py-2 text-foreground text-right font-medium">
                      {entry.quantity}
                    </td>
                    <td className="px-3 py-2 text-foreground text-right">
                      {formatMoney(entry.unitCost, currency)}
                    </td>
                    <td className="px-3 py-2 text-foreground text-right font-medium">
                      {formatMoney(entry.quantity * entry.unitCost, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {restockModalOpen && selectedVariant && (
        <RestockModal
          variant={selectedVariant}
          currency={currency}
          onClose={() => setRestockModalOpen(false)}
          onConfirm={async (quantity, unitCost) => {
            await restockVariant(selectedVariant.id, quantity, unitCost)
            void qc.invalidateQueries({ queryKey: qk.products(user) })
            void qc.invalidateQueries({
              queryKey: qk.productDetail(user, productId),
            })
            void qc.invalidateQueries({
              queryKey: qk.variantRestockHistory(user, selectedVariant.id),
            })
          }}
        />
      )}
    </section>
  )
}
