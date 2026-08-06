import { Menu } from 'lucide-react'
import type { RefObject } from 'react'
import type { Page } from '../../lib/navigation.ts'

export function Topbar({
  page,
  businessName,
  menuOpen,
  hamburgerRef,
  onOpenMenu,
}: {
  page: Page
  businessName: string
  menuOpen: boolean
  hamburgerRef: RefObject<HTMLButtonElement | null>
  onOpenMenu: () => void
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
          {page === 'Inicio' && <h1>Buenos días, {businessName}</h1>}
        </div>
      </div>
    </header>
  )
}
