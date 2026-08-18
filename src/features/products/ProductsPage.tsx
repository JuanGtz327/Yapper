import { useState, type KeyboardEvent } from 'react'
import { Boxes, DollarSign, Plus, Search, Tag } from 'lucide-react'
import { Empty } from '../../components/ui/Empty.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { formatMoney } from '../../lib/format.ts'
import { cn } from '../../lib/utils.ts'
import type { Category, Product } from '../../types.ts'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
import { PaginationControls } from '../../components/ui/PaginationControls.tsx'

type VariantRow = {
  product: Product
  variant: Product['variants'][number] | null
  isFirst: boolean
  rowSpan: number
  productIndex: number
}

const productDotColors: Record<string, string> = {
  coral: 'text-[#b06b57] bg-[#f9e5dc]',
  mint: 'text-[#579078] bg-[#dff1e6]',
  sky: 'text-[#52829e] bg-[#e0eff5]',
  lavender: 'text-[#7963a2] bg-[#ece5f7]',
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
  categories: productCategories = [],
  serverPagination,
  onSearchChange,
  categoryFilter: controlledCategoryFilter,
  onCategoryChange,
  stockFilter: controlledStockFilter,
  onStockChange,
  onAdd,
  onManageCategories,
  onEdit,
  onView,
}: {
  products: Product[]
  threshold: number
  currency: string
  search: string
  setSearch: (value: string) => void
  categories?: Category[]
  serverPagination?: {
    page: number
    total: number
    totalPages: number
    isFetching: boolean
    onPageChange: (page: number) => void
  }
  onSearchChange?: (value: string) => void
  categoryFilter?: string
  onCategoryChange?: (value: string) => void
  stockFilter?: '' | 'available' | 'low' | 'out'
  onStockChange?: (value: '' | 'available' | 'low' | 'out') => void
  onAdd: () => void
  onManageCategories: () => void
  onEdit: (product: Product) => void
  onView?: (product: Product) => void
}) {
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const activeCategoryFilter =
    controlledCategoryFilter === undefined
      ? categoryFilter
      : controlledCategoryFilter || 'all'
  const activeStockFilter =
    controlledStockFilter === undefined
      ? stockFilter
      : controlledStockFilter || 'all'
  const derivedCategories = Array.from(
    new Set(products.map((product) => product.category || 'Sin categoría')),
  ).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  const filtered = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase())
    const category = product.category || 'Sin categoría'
    const stocks = product.variants.map((variant) => variant.stock)
    const matchesCategory =
      activeCategoryFilter === 'all' || category === activeCategoryFilter
    const matchesStock =
      activeStockFilter === 'all' ||
      (activeStockFilter === 'available' &&
        stocks.some((stock) => stock > 0)) ||
      (activeStockFilter === 'low' &&
        stocks.some((stock) => stock > 0 && stock <= threshold)) ||
      (activeStockFilter === 'out' &&
        (!stocks.length || stocks.every((stock) => stock === 0)))
    return matchesSearch && matchesCategory && matchesStock
  })
  const visibleProducts = serverPagination ? products : filtered
  const rows = flattenProducts(visibleProducts)
  const openProduct = onView ?? onEdit

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
    <section className="animate-[page-in_0.25s_ease_both]">
      <div className="flex items-end justify-between mb-[27px] max-[650px]:flex-col max-[650px]:items-start max-[650px]:gap-[17px]">
        <div>
          <h1>Tus productos</h1>
          <p className="mt-0.5 ml-0.5">
            Administra precios, existencias y categorías.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="secondary"
            onClick={onManageCategories}
            type="button"
            icon={<Tag size={16} aria-hidden="true" />}
          >
            Categorías
          </Button>
          <Button
            variant="secondary"
            onClick={onAdd}
            type="button"
            icon={<Plus size={17} aria-hidden="true" />}
          >
            Añadir producto
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-[14px] p-3 px-4 border border-[#e3ddd5] rounded-[10px] bg-white text-xs">
        <DollarSign size={18} className="text-primary" aria-hidden="true" />
        <span className="font-bold text-[15px]">
          Inventario: {formatMoney(totalSaleValue, currency)}
        </span>
        <span className='font-bold text-[15px]'> | </span>
        <span className="font-bold text-[15px]">
          Inversión: {formatMoney(totalInvestment, currency)}
        </span>
        <strong className="ml-auto text-foreground text-[15px]">
          Ganancia: {formatMoney(totalProfit, currency)}
        </strong>
      </div>
      <div
        className="flex items-end gap-[10px] mb-[14px] max-[650px]:flex-col max-[650px]:items-stretch"
        aria-label="Filtros de productos"
      >
        <div className="relative w-full max-w-[300px]">
          <Search
            size={16}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            className="pl-8"
            aria-label="Buscar productos"
            value={search}
            onChange={(event) =>
              (onSearchChange ?? setSearch)(event.target.value)
            }
            placeholder="Buscar producto"
          />
        </div>
        <CustomSelect
          label="Categoría"
          value={activeCategoryFilter}
          onChange={(value) =>
            onCategoryChange
              ? onCategoryChange(value === 'all' ? '' : value)
              : setCategoryFilter(value)
          }
          ariaLabel="Filtrar por categoría"
          options={[
            { value: 'all', label: 'Todas' },
            ...(productCategories.length
              ? productCategories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))
              : derivedCategories.map((category) => ({
                  value: category,
                  label: category,
                }))),
          ]}
        />
        <CustomSelect
          label="Existencias"
          value={activeStockFilter}
          onChange={(value) =>
            onStockChange
              ? onStockChange(
                  value === 'all' ? '' : (value as 'available' | 'low' | 'out'),
                )
              : setStockFilter(value)
          }
          ariaLabel="Filtrar por existencias"
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'available', label: 'Con existencias' },
            { value: 'low', label: 'Bajo stock' },
            { value: 'out', label: 'Agotados' },
          ]}
        />
        {serverPagination && (
          <PaginationControls
            page={serverPagination.page}
            total={serverPagination.total}
            totalPages={serverPagination.totalPages}
            isFetching={serverPagination.isFetching}
            onPageChange={serverPagination.onPageChange}
          />
        )}
        {!serverPagination && (
          <span className="ml-auto pb-[10px] text-[#aaa5a8] text-[10px] max-[650px]:ml-0 max-[650px]:pb-0">
            {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
          </span>
        )}
      </div>
      <div className="overflow-auto border border-[#ebe8e4] rounded-[13px] bg-[#fffefa]">
        <table className="w-full border-collapse min-w-[650px] text-xs">
          <thead>
            <tr className="bg-[#6d3c72]">
              <th className="px-[14px] py-[14px] text-white text-[10px] font-bold text-center uppercase tracking-[0.7px] text-left rounded-tl-[12px]">
                Producto
              </th>
              <th className="px-[14px] py-[14px] text-white text-[10px] font-bold text-center uppercase tracking-[0.7px] text-left">
                Categoría
              </th>
              <th className="px-[14px] py-[14px] text-white text-[10px] font-bold text-center uppercase tracking-[0.7px]">
                SKU
              </th>
              <th className="px-[14px] py-[14px] text-white text-[10px] font-bold text-center uppercase tracking-[0.7px]">
                Costo
              </th>
              <th className="px-[14px] py-[14px] text-white text-[10px] font-bold text-center uppercase tracking-[0.7px]">
                Precio
              </th>
              <th className="px-[14px] py-[14px] text-white text-[10px] font-bold text-center uppercase tracking-[0.7px]">
                Existencias
              </th>
              <th className="px-[14px] py-[14px] text-white text-[10px] font-bold text-center uppercase tracking-[0.7px]">
                Valor
              </th>
              <th className="px-[14px] py-[14px] text-white text-[10px] font-bold text-center uppercase tracking-[0.7px] rounded-tr-[12px]">
                Ganancia
              </th>
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
                  className={cn(
                    'py-[15px] px-[18px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle focus-visible:outline-2 focus-visible:outline-[#6d3c72] focus-visible:outline-offset-[-2px]',
                    row.productIndex % 2 === 1 ? 'bg-[#f9f6fa]' : '',
                    hoveredProductId === row.product.id
                      ? 'bg-[#f3eef4] cursor-pointer'
                      : '',
                  )}
                  onClick={() => openProduct(row.product)}
                  onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openProduct(row.product)
                    }
                  }}
                  onMouseEnter={() => setHoveredProductId(row.product.id)}
                  onMouseLeave={() => setHoveredProductId(null)}
                >
                  {row.isFirst && (
                    <>
                      <td
                        className="px-[14px] py-[14px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle text-left text-ink"
                        rowSpan={row.rowSpan}
                      >
                        <div
                          className={cn(
                            'inline-grid place-items-center w-[34px] h-[34px] mr-[10px] rounded-[9px]',
                            productDotColors[row.product.color] ?? '',
                          )}
                        >
                          <Boxes size={18} aria-hidden="true" />
                        </div>
                        <strong>{row.product.name}</strong>
                      </td>
                      <td
                        className="px-[14px] py-[14px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle text-left text-ink"
                        rowSpan={row.rowSpan}
                      >
                        {row.product.category}
                      </td>
                    </>
                  )}
                  <td className="px-[14px] py-[14px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle">
                    {row.variant?.sku || '—'}
                    {label && (
                      <span className="block text-[11px] font-normal text-muted-foreground mt-[2px]">
                        {label}
                      </span>
                    )}
                  </td>
                  <td className="px-[14px] py-[14px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle text-right">
                    {formatMoney(cost, currency)}
                  </td>
                  <td className="px-[14px] py-[14px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle text-ink font-bold text-right">
                    {formatMoney(price, currency)}
                  </td>
                  <td className="px-[14px] py-[14px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle">
                    <span
                      data-testid={`inventory-stock-${row.variant?.sku ?? row.product.id}`}
                      className={
                        stock <= threshold
                          ? 'font-bold text-[#c5804a]'
                          : 'font-bold text-[#5f9e7c]'
                      }
                    >
                      {stock}
                    </span>
                  </td>
                  <td className="px-[14px] py-[14px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle text-ink font-bold text-right">
                    {formatMoney(value, currency)}
                  </td>
                  <td className="px-[14px] py-[14px] border-b border-[#f0eeec] text-[#837e84] text-center align-middle text-ink font-bold text-right">
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
