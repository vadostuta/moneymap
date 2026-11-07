import * as React from 'react'
import { cn } from '@/lib/utils'

// The two page widths. 'wide' for dashboards, lists and anything with a grid
// of cards; 'narrow' for forms and single-column reading (Claims).
const WIDTH = {
  wide: 'max-w-7xl',
  narrow: 'max-w-3xl'
}

export function PageContainer ({
  width = 'wide',
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { width?: keyof typeof WIDTH }) {
  return (
    <div
      className={cn(
        'container px-3 sm:px-4 md:px-6 ml-0 sm:ml-2 py-4',
        WIDTH[width],
        className
      )}
      {...props}
    />
  )
}

// One header for every section page: the title (18 → 20 → 24px), an optional
// muted line under it, and actions or tabs on the right that wrap below the
// title on narrow screens.
export function PageHeader ({
  title,
  description,
  actions,
  className
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2',
        className
      )}
    >
      <div className='min-w-0'>
        <h1 className='text-lg sm:text-xl md:text-2xl font-bold'>{title}</h1>
        {description && (
          <p className='text-sm text-muted-foreground'>{description}</p>
        )}
      </div>
      {actions}
    </div>
  )
}
