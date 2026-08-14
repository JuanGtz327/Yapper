import { useState, type KeyboardEvent } from 'react'
import { Boxes, DollarSign, Plus, Search, Tag } from 'lucide-react'
import { Empty } from '../../components/ui/Empty.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { formatMoney } from '../../lib/format.ts'
import type { Product } from '../../types.ts'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'

type VariantRow = {
  product: Product
  variant: Product['variants'][number] | null
  isFirst: boolean
  rowSpan: number
  productIndex: number
}

function flattenProducts(products: Product[]): VariantRow[] {
  const rows: VariantRow[] = []
  let productIndex = 0
  for (const product of products) {
    const variants =
      product.variants.length > 0
        ? product.variants
        : [
            {
              id: `${product.id}-empty`,
              productId: product.id,
              sku: '',
              name: '',
              inventoryCost: 0,
              salePrice: 0,
              stock: 0,
              optionValues: [],
            },
          ]
    for (let i = 0; i < variants.length; i++) {
      rows.push({
        product,
        variant: variants[i],
        isFirst: i === 0,
        rowSpan: i === 0 ? variants.length : 0,
        productIndex,
      })
    }
    productIndex++
  }
  return rows
}

function variantLabel(v: Product['variants'][number]): string {
  if (!v || v.optionValues.length === 0) return ''
  return v.optionValues.map((ov) => ov.value).join(' / ')
}

export function ProductsPage({
  products,
  threshold,
  currency,
  search,
  setSearch,
  onAdd,
  onManageCategories,
  onEdit,
}: {
  products: Product[]
  threshold: number
  currency: string
  search: string
  setSearch: (value: string) => void
  onAdd: () => void
  onManageCategories: () => void
  onEdit: (product: Product) => void
}) {
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const categories = Array.from(
    new Set(products.map((product) => product.category || 'Sin categoría')),
  ).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  const filtered = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase())
    const category = product.category || 'Sin categoría'
    const stocks = product.variants.map((variant) => variant.stock)
    const matchesCategory =
      categoryFilter === 'all' || category === categoryFilter
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'available' && stocks.some((stock) => stock > 0)) ||
      (stockFilter === 'low' &&
        stocks.some((stock) => stock > 0 && stock <= threshold)) ||
      (stockFilter === 'out' &&
        (!stocks.length || stocks.every((stock) => stock === 0)))
    return matchesSearch && matchesCategory && matchesStock
  })
  const rows = flattenProducts(filtered)

  const totalInvestment = products.reduce(
    (sum, product) =>
      sum +
      product.variants.reduce((vSum, v) => vSum + v.stock * v.inventoryCost, 0),
    0,
  )
  const totalSaleValue = products.reduce(
    (sum, product) =>
      sum +
      product.variants.reduce((vSum, v) => vSum + v.stock * v.salePrice, 0),
    0,
  )
  const totalProfit = totalSaleValue - totalInvestment

  return (
    <section className="page-section">
      <div className="section-intro">
        <div>
          <span className="eyebrow">CONTROL DE INVENTARIO</span>
          <h2>Tus productos</h2>
          <p>Administra precios, existencias y categorías.</p>
        </div>
        <div className="section-actions">
          <Button
            variant="secondary"
            onClick={onManageCategories}
            type="button"
            icon={<Tag size={16} aria-hidden="true" />}
          >
            Categorías
          </Button>
          <Button variant="secondary" onClick={onAdd} type="button" icon={<Plus size={17} aria-hidden="true" />}>
            Añadir producto
          </Button>
        </div>
      </div>
      <div className="inventory-summary">
        <DollarSign size={18} aria-hidden="true" />
        <span>Inversión: {formatMoney(totalInvestment, currency)}</span>
        <span>Inventario: {formatMoney(totalSaleValue, currency)}</span>
        <strong>Ganancia: {formatMoney(totalProfit, currency)}</strong>
      </div>
      <div className="table-filters" aria-label="Filtros de productos">
        <div className="relative w-full max-w-[300px]">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            className="pl-8"
            aria-label="Buscar productos"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar producto"
          />
        </div>
        <label>
          Categoría
          <CustomSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            ariaLabel="Filtrar por categoría"
            options={[
              { value: 'all', label: 'Todas' },
              ...categories.map((category) => ({
                value: category,
                label: category,
              })),
            ]}
          />
        </label>
        <label>
          Existencias
          <CustomSelect
            value={stockFilter}
            onChange={setStockFilter}
            ariaLabel="Filtrar por existencias"
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'available', label: 'Con existencias' },
              { value: 'low', label: 'Bajo stock' },
              { value: 'out', label: 'Agotados' },
            ]}
          />
        </label>
        <span className="table-filter-count">
          {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th className="col-left">Producto</th>
              <th className="col-left">Categoría</th>
              <th>SKU</th>
              <th>Costo</th>
              <th>Precio</th>
              <th>Existencias</th>
              <th>Valor</th>
              <th>Ganancia</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const stock = row.variant?.stock ?? 0
              const cost = row.variant?.inventoryCost ?? 0
              const price = row.variant?.salePrice ?? 0
              const value = stock * price
              const profit = stock * (price - cost)
              const label = row.variant ? variantLabel(row.variant) : ''
              return (
                <tr
                  key={`${row.product.id}-${row.variant?.id ?? idx}`}
                  tabIndex={0}
                  aria-label={`Abrir ${row.product.name}`}
                  className={[
                    row.productIndex % 2 === 1 ? 'zebra-stripe' : '',
                    hoveredProductId === row.product.id ? 'row-hover' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onEdit(row.product)}
                  onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onEdit(row.product)
                    }
                  }}
                  onMouseEnter={() => setHoveredProductId(row.product.id)}
                  onMouseLeave={() => setHoveredProductId(null)}
                >
                  {row.isFirst && (
                    <>
                      <td className="col-left" rowSpan={row.rowSpan}>
                        <div className={`product-dot ${row.product.color}`}>
                          <Boxes size={18} aria-hidden="true" />
                        </div>
                        <strong>{row.product.name}</strong>
                      </td>
                      <td className="col-left" rowSpan={row.rowSpan}>
                        {row.product.category}
                      </td>
                    </>
                  )}
                  <td>
                    {row.variant?.sku || '—'}
                    {label && <span className="variant-label">{label}</span>}
                  </td>
                  <td className="col-right">{formatMoney(cost, currency)}</td>
                  <td className="table-emphasis">
                    {formatMoney(price, currency)}
                  </td>
                  <td>
                    <span
                      className={stock <= threshold ? 'stock low' : 'stock'}
                    >
                      {stock}
                    </span>
                  </td>
                  <td className="table-emphasis">
                    {formatMoney(value, currency)}
                  </td>
                  <td className="table-emphasis">
                    {formatMoney(profit, currency)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <Empty text="No encontramos productos con ese nombre." />
        )}
      </div>
    </section>
  )
}
