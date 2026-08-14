import { useEffect, useRef, type RefObject } from 'react'
import { Link } from 'wouter'
import { Settings, X } from 'lucide-react'
import type { Page } from '../../lib/navigation.ts'
import { navItems } from '../../lib/navigation.ts'
import { pageToPathname } from '../../lib/routes.ts'

export function MobileNavDrawer({
  page,
  onClose,
  hamburgerRef,
}: {
  page: Page
  onClose: () => void
  hamburgerRef: RefObject<HTMLButtonElement | null>
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const hamburger = hamburgerRef.current
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const drawer = drawerRef.current
      if (!drawer) return
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('disabled'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      hamburger?.focus()
    }
  }, [hamburgerRef])

  return (
    <>
      <button
        className="mobile-drawer-overlay"
        onClick={onClose}
        aria-label="Cerrar menú de navegación"
        type="button"
      />
      <aside
        ref={drawerRef}
        id="mobile-navigation"
        className="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-navigation-title"
      >
        <div className="mobile-drawer-heading">
          <div className="brand">
            <div className="brand-mark">Y</div>
            <div>
              <strong>Yapper</strong>
              <span>Gestor de ventas</span>
            </div>
          </div>
          <button
            ref={closeRef}
            className="icon-button"
            onClick={onClose}
            aria-label="Cerrar menú"
            type="button"
          >
            <X size={21} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Navegación móvil">
          <p id="mobile-navigation-title" className="nav-label">
            MENÚ PRINCIPAL
          </p>
          {navItems.map(({ label, icon: Icon }) => (
            <Link
              key={label}
              href={pageToPathname(label)}
              aria-current={page === label ? 'page' : undefined}
              className={page === label ? 'nav-item active' : 'nav-item'}
              onClick={onClose}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
          <Link
            href={pageToPathname('Ajustes')}
            aria-current={page === 'Ajustes' ? 'page' : undefined}
            className={page === 'Ajustes' ? 'nav-item active' : 'nav-item'}
            onClick={onClose}
          >
            <Settings size={20} aria-hidden="true" />
            <span>Ajustes</span>
          </Link>
        </nav>
      </aside>
    </>
  )
}
