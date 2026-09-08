interface YugmitBrandProps {
  className?: string
  label?: string
}

/** Compact brand treatment for application headers; the source PNG mark is used unchanged. */
export function YugmitBrand({ className = '', label }: YugmitBrandProps) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      <img src="/brand/yugmit-mark.png" alt="" aria-hidden="true" className="size-8 shrink-0 object-contain" />
      <span className="font-heading truncate text-lg font-semibold tracking-tight">YUGMIT</span>
      {label ? <span className="hidden truncate text-xs text-muted-foreground sm:inline">/ {label}</span> : null}
    </div>
  )
}
