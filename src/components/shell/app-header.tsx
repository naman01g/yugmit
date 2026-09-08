import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MenuIcon } from '@/components/ui/icons'
import { YugmitBrand } from './yugmit-brand'

interface AppHeaderProps {
  title: string
  personaLabel?: string
  onOpenSidebar?: () => void
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function AppHeader({ title, personaLabel, onOpenSidebar }: AppHeaderProps) {
  const { userProfile, logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        {onOpenSidebar ? (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={onOpenSidebar}
          >
            <MenuIcon className="size-5" />
          </Button>
        ) : null}

        {title === 'YUGMIT' ? <YugmitBrand label={personaLabel} /> : <div className="flex min-w-0 items-baseline gap-2"><YugmitBrand /><span className="hidden truncate text-xs text-muted-foreground sm:inline">/ {title}</span></div>}

        <div className="ml-auto flex items-center gap-3">
          {userProfile ? (
            <>
              <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                {userProfile.name}
              </span>
              <Avatar className="size-8">
                <AvatarFallback className="bg-muted text-xs font-medium">
                  {initialsFromName(userProfile.name)}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void logout()}
                className="text-xs"
              >
                Sign out
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
