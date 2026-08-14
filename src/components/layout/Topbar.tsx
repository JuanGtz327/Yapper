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
    <header className="flex items-end justify-between">
      <div className="flex items-center gap-[14px]">
        <button
          ref={hamburgerRef}
          className="hidden max-[850px]:grid place-items-center w-[44px] h-[44px] p-0 border border-[#ded5df] rounded-[10px] text-primary bg-sidebar"
          aria-label="Abrir menú de navegación"
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          onClick={onOpenMenu}
          type="button"
        >
          <Menu size={23} aria-hidden="true" />
        </button>
        <div>
          <p className="mb-[9px] text-muted-text text-[10px] font-bold tracking-[1.25px] uppercase">
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
