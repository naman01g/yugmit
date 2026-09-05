import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'The requested information could not be loaded. Please try again.',
  actionLabel = 'Try again',
  onAction,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-card px-6 py-14 text-center',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-destructive">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {actionLabel && onAction ? (
        <Button className="mt-3" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
