import { PageHeader } from './page-header'
import { StatusIndicator } from '@/components/feedback/status-indicator'

interface ModulePlaceholderProps {
  title: string
  subtitle?: string
  module: string
  route: string
  description?: string
}

/**
 * Signals that a route is a Module 01 shell placeholder and identifies the
 * future module that owns its implementation. Explicitly labelled so the
 * placeholder cannot be mistaken for a working feature.
 */
export function ModulePlaceholder({
  title,
  subtitle,
  module,
  route,
  description,
}: ModulePlaceholderProps) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="rounded-lg border border-dashed border-border bg-card p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">
              Placeholder route: not yet implemented
            </h2>
            <p className="text-sm text-muted-foreground">
              Owned by <span className="font-medium text-foreground">{module}</span>
            </p>
          </div>
          <StatusIndicator label="Not implemented" tone="warning" />
        </div>

        <dl className="grid gap-3 rounded-md border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">URL</dt>
            <dd className="mt-0.5 font-mono text-xs">{route}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Scope</dt>
            <dd className="mt-0.5">
              {description ?? 'To be implemented in the owning module.'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
