import { useEffect, useRef, type RefObject } from 'react'
import { Link } from 'wouter'
import { Settings, X } from 'lucide-react'
import { cn } from '@/lib/utils'
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
      <style>{`
        @keyframes drawer-in {
          from { opacity: 0; transform: translateX(-18px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <button
        className="fixed inset-0 z-[19] border-0 bg-[#30272e66]"
        onClick={onClose}
        aria-label="Cerrar menú de navegación"
        type="button"
      />
      <aside
        ref={drawerRef}
        id="mobile-navigation"
        className="fixed inset-y-0 left-0 z-[20] flex flex-col w-[min(320px,86vw)] py-[28px] px-[18px] pb-[22px] border-r border-border bg-sidebar shadow-[18px_0_45px_#30272e22] animate-[drawer-in_0.2s_ease_both]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-navigation-title"
      >
        <div className="flex items-start justify-between mb-[35px]">
          <div className="flex items-center gap-[11px] px-[8px]">
            <div className="grid place-items-center w-[38px] h-[38px] rounded-xl text-white bg-primary text-[23px] font-bold -rotate-7">
              Y
            </div>
            <div>
              <strong className="block text-foreground text-[15px] tracking-[-0.2px]">
                Yapper
              </strong>
              <span className="block text-profile-sub text-[11px] mt-[2px]">
                Gestor de ventas
              </span>
            </div>
          </div>
          <button
            ref={closeRef}
            className="flex items-center justify-center w-[34px] h-[34px] p-0 border border-[#ded5df] rounded-[10px] text-primary bg-sidebar hover:bg-nav-hover transition-colors"
            onClick={onClose}
            aria-label="Cerrar menú"
            type="button"
          >
            <X size={21} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Navegación móvil">
          <p
            id="mobile-navigation-title"
            className="color-muted-text text-[10px] font-bold tracking-[1.1px] mx-[14px] mb-[13px]"
          >
            MENÚ PRINCIPAL
          </p>
          {navItems.map(({ label, icon: Icon }) => (
            <Link
              key={label}
              href={pageToPathname(label)}
              aria-current={page === label ? 'page' : undefined}
              className={cn(
                'flex items-center gap-[13px] text-[#756f77] no-underline text-[14px] font-bold my-[4px] mx-0 py-[12px] px-[14px] rounded-[10px] transition-all duration-200 hover:text-primary hover:bg-nav-hover',
                page === label && 'text-primary',
              )}
              onClick={onClose}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="inline">{label}</span>
            </Link>
          ))}
          <Link
            href={pageToPathname('Ajustes')}
            aria-current={page === 'Ajustes' ? 'page' : undefined}
            className={cn(
              'flex items-center gap-[13px] text-[#756f77] no-underline text-[14px] font-bold my-[4px] mx-0 py-[12px] px-[14px] rounded-[10px] transition-all duration-200 hover:text-primary hover:bg-nav-hover',
              page === 'Ajustes' && 'text-primary',
            )}
            onClick={onClose}
          >
            <Settings size={20} aria-hidden="true" />
            <span className="inline">Ajustes</span>
          </Link>
        </nav>
      </aside>
    </>
  )
}
