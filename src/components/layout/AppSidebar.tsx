import { Settings } from 'lucide-react'
import type { Page } from '../../lib/navigation.ts'
import { navItems } from '../../lib/navigation.ts'

export function AppSidebar({
  page,
  onNavigate,
  businessName,
  accountLabel,
}: {
  page: Page
  onNavigate: (page: Page) => void
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
          <button
            aria-label={label}
            className={page === label ? 'nav-item active' : 'nav-item'}
            key={label}
            onClick={() => onNavigate(label as Page)}
            title={label}
            type="button"
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button
          aria-label="Ajustes"
          className={page === 'Ajustes' ? 'nav-item active' : 'nav-item'}
          onClick={() => onNavigate('Ajustes')}
          title="Ajustes"
          type="button"
        >
          <Settings size={20} aria-hidden="true" />
          <span>Ajustes</span>
        </button>
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
