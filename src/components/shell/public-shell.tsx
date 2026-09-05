import { Outlet } from 'react-router-dom'

import { AppHeader } from './app-header'
import { PageContainer } from './page-container'

export function PublicShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader title="YUGMIT" />
      <main className="flex-1">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>
    </div>
  )
}