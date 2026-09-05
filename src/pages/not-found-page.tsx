import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/shell/page-container'

export function NotFoundPage() {
  return (
    <PageContainer className="py-16">
      <div className="mx-auto max-w-md rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for does not exist or has moved.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Return home</Link>
        </Button>
      </div>
    </PageContainer>
  )
}