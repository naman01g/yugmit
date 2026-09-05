import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'

import type { Persona } from '@/types'
import { personaNavigation } from '@/config/navigation'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'
import { PageContainer } from './page-container'

interface PersonaShellProps {
  persona: Persona
}

export function PersonaShell({ persona }: PersonaShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const nav = personaNavigation[persona]

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        title="YUGMIT"
        personaLabel={nav.label}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
      <div className="flex flex-1">
        <AppSidebar persona={persona} open={sidebarOpen} onClose={closeSidebar} />
        <main className="min-w-0 flex-1">
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
      </div>
    </div>
  )
}
