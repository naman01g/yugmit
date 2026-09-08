import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { cn } from '@/lib/utils'
import {
  activeNavItemId,
  personaNavigation,
  type PersonaNavConfig,
} from '@/config/navigation'
import type { Persona } from '@/types'

interface SidebarNavProps {
  config: PersonaNavConfig
  footer?: ReactNode
}

function SidebarNav({ config, footer }: SidebarNavProps) {
  const { pathname } = useLocation()
  const activeItemId = activeNavItemId(config, pathname)

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {config.title}
        </p>
      </div>
      <nav
        aria-label={config.label}
        className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4"
      >
        {config.items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            aria-current={activeItemId === item.id ? 'page' : undefined}
            className={cn(
              'flex flex-col gap-0.5 rounded-md px-3 py-2 text-sm transition-colors',
              item.id === activeItemId
                ? 'bg-accent font-medium text-accent-foreground'
                : 'text-foreground/80 hover:bg-muted hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {footer ? <div className="px-4 pb-4">{footer}</div> : null}
    </div>
  )
}

interface AppSidebarProps {
  persona: Persona
  open: boolean
  onClose?: () => void
}

export function AppSidebar({ persona, open, onClose }: AppSidebarProps) {
  const config = personaNavigation[persona]

  const desktop = (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
        <SidebarNav config={config} />
      </div>
    </aside>
  )

  const mobile = open ? (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-card shadow-none"
        role="dialog"
        aria-label={`${config.label} navigation`}
      >
        <SidebarNav config={config} />
      </aside>
    </div>
  ) : null

  return (
    <>
      {desktop}
      {mobile}
    </>
  )
}
