import { ArrowUpRight, Plus, Search, Settings, Trash2 } from 'lucide-react'
import { Empty } from '../../components/ui/Empty.tsx'
import type { Client } from '../../types.ts'

export function ClientsPage({
  clients,
  search,
  setSearch,
  onAdd,
  onEdit,
  onRemove,
}: {
  clients: Client[]
  search: string
  setSearch: (value: string) => void
  onAdd: () => void
  onEdit: (client: Client) => void
  onRemove: (id: string) => void
}) {
  const visible = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase()),
  )
  return (
    <section className="page-section">
      <div className="section-intro">
        <div>
          <span className="eyebrow">RELACIONES</span>
          <h2>Tus clientes</h2>
          <p>Ten a mano sus datos e historial de pedidos.</p>
        </div>
        <button className="secondary-button" onClick={onAdd} type="button">
          <Plus size={17} />
          Nuevo cliente
        </button>
      </div>
      <div className="toolbar">
        <label className="search-box">
          <Search aria-hidden="true" size={18} />
          <input
            aria-label="Buscar cliente"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cliente"
          />
        </label>
        <span>{clients.length} clientes</span>
      </div>
      <div className="client-grid">
        {visible.map((client) => (
          <article className="client-card" key={client.id}>
            <div className="client-card-top">
              <div className="avatar">{client.initials}</div>
              <div className="row-actions">
                <button
                  className="icon-button"
                  onClick={() => onEdit(client)}
                  aria-label={`Editar ${client.name}`}
                  type="button"
                >
                  <Settings size={16} />
                </button>
                <button
                  className="icon-button danger"
                  onClick={() => onRemove(client.id)}
                  aria-label={`Eliminar ${client.name}`}
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3>{client.name}</h3>
            <p>{client.phone}</p>
            <p>{client.zone}</p>
            <div className="client-orders">
              <span>{client.orders} pedidos</span>
              <ArrowUpRight size={16} />
            </div>
          </article>
        ))}
      </div>
      {visible.length === 0 && (
        <Empty text="No encontramos clientes con ese nombre." />
      )}
    </section>
  )
}
