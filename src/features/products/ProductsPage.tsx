import { useState } from 'react'
import { Boxes, DollarSign, Pencil, Plus, Search, Tag, Trash2 } from 'lucide-react'
import { Empty } from '../../components/ui/Empty.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { formatMoney } from '../../lib/format.ts'
import type { Product } from '../../types.ts'

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
        : [{ id: `${product.id}-empty`, productId: product.id, sku: '', name: '', inventoryCost: 0, salePrice: 0, stock: 0, optionValues: [] }]
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
  onRemove,
}: {
  products: Product[]
  threshold: number
  currency: string
  search: string
  setSearch: (value: string) => void
  onAdd: () => void
  onManageCategories: () => void
  onEdit: (product: Product) => void
  onRemove: (id: string) => void
}) {
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null)
  const filtered = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()),
  )
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
          <button className="secondary-button" onClick={onManageCategories} type="button">
            <Tag size={16} aria-hidden="true" />
            Categorías
          </button>
          <button className="secondary-button" onClick={onAdd} type="button">
            <Plus size={17} aria-hidden="true" />
            Añadir producto
          </button>
        </div>
      </div>
      <div className="inventory-summary">
        <DollarSign size={18} aria-hidden="true" />
        <span>Inversión: {formatMoney(totalInvestment, currency)}</span>
        <span>Venta: {formatMoney(totalSaleValue, currency)}</span>
        <strong>Ganancia: {formatMoney(totalProfit, currency)}</strong>
      </div>
      <div className="toolbar">
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            aria-label="Buscar productos"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar producto"
          />
        </label>
        <span>
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
              <th className="col-right" aria-label="Acciones" />
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
                  className={[
                    row.productIndex % 2 === 1 ? 'zebra-stripe' : '',
                    hoveredProductId === row.product.id ? 'row-hover' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
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
                      <td className="col-left" rowSpan={row.rowSpan}>{row.product.category}</td>
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
                  {row.isFirst && (
                    <td className="row-actions col-right" rowSpan={row.rowSpan}>
                      <div className="row-actions-inner">
                        <Button
                          variant="primary"
                          icon={<Pencil size={16} aria-hidden="true" />}
                          onClick={() => onEdit(row.product)}
                          aria-label={`Editar ${row.product.name}`}
                          type="button"
                        />
                        <Button
                          variant="danger"
                          icon={<Trash2 size={17} aria-hidden="true" />}
                          onClick={() => onRemove(row.product.id)}
                          aria-label={`Eliminar ${row.product.name}`}
                          type="button"
                        />
                      </div>
                    </td>
                  )}
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
