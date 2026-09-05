import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  )
}

interface LoadingStateProps {
  label?: string
  className?: string
}

export function LoadingState({
  label = 'Loading',
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center',
        className,
      )}
    >
      <Spinner className="text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
