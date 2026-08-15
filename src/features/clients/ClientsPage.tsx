import { ArrowUpRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Empty } from '../../components/ui/Empty.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
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
    <section className="animate-[page-in_0.25s_ease_both]">
      <div className="flex items-end justify-between mb-[27px] max-[650px]:flex-col max-[650px]:items-start max-[650px]:gap-[17px]">
        <div>
          <h1>Tus clientes</h1>
          <p className='mt-0.5 ml-0.5'>Ten a mano sus datos e historial de pedidos.</p>
        </div>
        <Button
          variant="secondary"
          onClick={onAdd}
          type="button"
          icon={<Plus size={17} />}
        >
          Nuevo cliente
        </Button>
      </div>
      <div className="flex items-center justify-between mb-3 text-[#aaa5a8] text-[11px]">
        <div className="relative w-full max-w-[300px]">
          <Search
            size={16}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            className="pl-8"
            aria-label="Buscar cliente"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cliente"
          />
        </div>
        <span>{clients.length} clientes</span>
      </div>
      <div className="grid grid-cols-2 gap-[14px]">
        {visible.map((client) => (
          <article
            className="p-[19px] border border-[#ebe8e4] rounded-[13px] bg-[#fffefa]"
            key={client.id}
          >
            <div className="flex items-center justify-between">
              <div className="inline-grid place-items-center w-[34px] h-[34px] rounded-full bg-[#f3d7cb] text-[#734b4c] text-[11px] font-bold">
                {client.initials}
              </div>
              <div className="flex gap-2 items-center justify-center">
                <Button
                  variant="primary"
                  icon={<Pencil size={16} />}
                  onClick={() => onEdit(client)}
                  aria-label={`Editar ${client.name}`}
                  type="button"
                />
                <Button
                  variant="danger"
                  icon={<Trash2 size={16} />}
                  onClick={() => onRemove(client.id)}
                  aria-label={`Eliminar ${client.name}`}
                  type="button"
                />
              </div>
            </div>
            <h3 className="mt-[14px] mb-[6px] text-ink text-[14px]">
              {client.name}
            </h3>
            <p className="text-[#928c92] text-[11px] mt-[3px]">
              {client.phone}
            </p>
            <p className="text-[#928c92] text-[11px] mt-[3px]">{client.zone}</p>
            <div className="flex items-center justify-between mt-[17px] pt-[13px] border-t border-[#ebe8e4] text-[#6d3c72] text-[11px] font-bold">
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
