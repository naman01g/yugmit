import { cn } from '@/lib/utils'

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'destructive'

interface StatusIndicatorProps {
  label: string
  tone?: StatusTone
  className?: string
}

const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-muted text-muted-foreground border-transparent',
  info: 'bg-accent text-accent-foreground border-transparent',
  success: 'bg-success/15 text-success border-transparent',
  warning: 'bg-warning/15 text-warning border-transparent',
  destructive: 'bg-destructive/15 text-destructive border-transparent',
}

export function StatusIndicator({
  label,
  tone = 'neutral',
  className,
}: StatusIndicatorProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-current"
      />
      {label}
    </span>
  )
}
