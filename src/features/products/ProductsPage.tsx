import { Boxes, Plus, Search, Settings, Trash2 } from 'lucide-react'
import { Empty } from '../../components/ui/Empty.tsx'
import { formatMoney } from '../../lib/format.ts'
import type { Product } from '../../types.ts'

export function ProductsPage({
  products,
  threshold,
  currency,
  search,
  setSearch,
  onAdd,
  onEdit,
  onRemove,
}: {
  products: Product[]
  threshold: number
  currency: string
  search: string
  setSearch: (value: string) => void
  onAdd: () => void
  onEdit: (product: Product) => void
  onRemove: (id: string) => void
}) {
  const visible = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()),
  )
  return (
    <section className="page-section">
      <div className="section-intro">
        <div>
          <span className="eyebrow">CONTROL DE INVENTARIO</span>
          <h2>Tus productos</h2>
          <p>Administra precios, existencias y categorías.</p>
        </div>
        <button className="secondary-button" onClick={onAdd} type="button">
          <Plus size={17} aria-hidden="true" />
          Añadir producto
        </button>
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
        <span>{products.length} productos</span>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Existencias</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {visible.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className={`product-dot ${product.color}`}>
                    <Boxes size={18} aria-hidden="true" />
                  </div>
                  <strong>{product.name}</strong>
                </td>
                <td>{product.category}</td>
                <td className="table-emphasis">
                  {formatMoney(product.price, currency)}
                </td>
                <td>
                  <span
                    className={
                      product.stock <= threshold ? 'stock low' : 'stock'
                    }
                  >
                    {product.stock} {product.unit}s
                  </span>
                </td>
                <td className="row-actions">
                  <button
                    className="icon-button"
                    onClick={() => onEdit(product)}
                    aria-label={`Editar ${product.name}`}
                    type="button"
                  >
                    <Settings size={16} aria-hidden="true" />
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() => onRemove(product.id)}
                    aria-label={`Eliminar ${product.name}`}
                    type="button"
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <Empty text="No encontramos productos con ese nombre." />
        )}
      </div>
    </section>
  )
}
