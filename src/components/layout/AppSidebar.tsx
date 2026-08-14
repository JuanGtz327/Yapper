import { Link } from 'wouter'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
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
    <aside className="w-[252px] shrink-0 flex flex-col py-[32px] px-[18px] pb-[22px] bg-sidebar border-r border-border max-[850px]:hidden">
      <div className="flex items-center gap-[11px] px-[14px] pb-[48px]">
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
      <nav className="flex-1" aria-label="Navegación principal">
        <p className="color-muted-text text-[10px] font-bold tracking-[1.1px] mx-[14px] mb-[13px]">
          MENÚ PRINCIPAL
        </p>
        {navItems.map(({ label, icon: Icon }) => (
          <Link
            key={label}
            href={pageToPathname(label)}
            className={cn(
              'flex items-center gap-[13px] text-nav-text no-underline text-[14px] font-bold my-[4px] mx-0 py-[12px] px-[14px] rounded-[10px] transition-all duration-200 hover:text-primary hover:bg-nav-hover',
              page === label && 'text-primary bg-nav-active',
            )}
            title={label}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="pt-[16px] border-t border-border">
        <Link
          href={pageToPathname('Ajustes')}
          className={cn(
            'flex items-center gap-[13px] text-nav-text no-underline text-[14px] font-bold my-[4px] mx-0 py-[12px] px-[14px] rounded-[10px] transition-all duration-200 hover:text-primary hover:bg-nav-hover',
            page === 'Ajustes' && 'text-primary bg-nav-active',
          )}
          title="Ajustes"
        >
          <Settings size={20} aria-hidden="true" />
          <span>Ajustes</span>
        </Link>
        <div className="flex items-center gap-[10px] pt-[19px] px-[14px]">
          <div className="grid place-items-center w-[34px] h-[34px] rounded-full text-avatar-text bg-avatar-bg text-[11px] font-bold">
            {businessName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <strong className="block text-foreground text-[15px] tracking-[-0.2px]">
              {businessName}
            </strong>
            <span className="block text-profile-sub text-[11px] mt-[2px]">
              {accountLabel}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
