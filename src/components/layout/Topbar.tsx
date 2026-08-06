import { Menu, Plus } from 'lucide-react'
import type { RefObject } from 'react'
import type { Page } from '../../lib/navigation.ts'

export function Topbar({
  page,
  businessName,
  menuOpen,
  hamburgerRef,
  onOpenMenu,
  onOpenModal,
}: {
  page: Page
  businessName: string
  menuOpen: boolean
  hamburgerRef: RefObject<HTMLButtonElement | null>
  onOpenMenu: () => void
  onOpenModal: (type: 'product' | 'client' | 'order') => void
}) {
  return (
    <header className="topbar">
      <div className="topbar-heading">
        <button
          ref={hamburgerRef}
          className="mobile-menu-button"
          aria-label="Abrir menú de navegación"
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          onClick={onOpenMenu}
          type="button"
        >
          <Menu size={23} aria-hidden="true" />
        </button>
        <div>
          <p className="eyebrow">
            {new Intl.DateTimeFormat('es-MX', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
              .format(new Date())
              .toUpperCase()}
          </p>
          <h1>{page === 'Inicio' ? `Buenos días, ${businessName}` : page}</h1>
        </div>
      </div>
      {!['Tienda', 'Estadísticas', 'Ajustes'].includes(page) && (
        <button
          className="primary-button"
          onClick={() =>
            onOpenModal(
              page === 'Clientes'
                ? 'client'
                : page === 'Pedidos'
                  ? 'order'
                  : 'product',
            )
          }
          type="button"
        >
          <Plus size={19} />
          {page === 'Clientes'
            ? 'Nuevo cliente'
            : page === 'Almacén'
              ? 'Añadir producto'
              : 'Crear pedido'}
        </button>
      )}
    </header>
  )
}
