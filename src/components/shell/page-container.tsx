import * as React from 'react'

import { cn } from '@/lib/utils'

interface PageContainerProps extends React.ComponentProps<'div'> {
  asChild?: never
}

export function PageContainer({ className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8',
        className,
      )}
      {...props}
    />
  )
}
