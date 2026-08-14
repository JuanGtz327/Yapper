import { Link } from 'wouter'
import { Settings } from 'lucide-react'
import type { Page } from '../../lib/navigation.ts'
import { navItems } from '../../lib/navigation.ts'
import { pageToPathname } from '../../lib/routes.ts'

export function AppSidebar({
  page,
  businessName,
  accountLabel,
}: {
  page: Page
  businessName: string
  accountLabel: string
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">Y</div>
        <div>
          <strong>Yapper</strong>
          <span>Gestor de ventas</span>
        </div>
      </div>
      <nav className="main-nav" aria-label="Navegación principal">
        <p className="nav-label">MENÚ PRINCIPAL</p>
        {navItems.map(({ label, icon: Icon }) => (
          <Link
            key={label}
            href={pageToPathname(label)}
            className={page === label ? 'nav-item active' : 'nav-item'}
            title={label}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <Link
          href={pageToPathname('Ajustes')}
          className={page === 'Ajustes' ? 'nav-item active' : 'nav-item'}
          title="Ajustes"
        >
          <Settings size={20} aria-hidden="true" />
          <span>Ajustes</span>
        </Link>
        <div className="profile">
          <div className="avatar">{businessName.slice(0, 2).toUpperCase()}</div>
          <div>
            <strong>{businessName}</strong>
            <span>{accountLabel}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
