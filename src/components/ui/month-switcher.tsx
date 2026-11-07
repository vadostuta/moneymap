'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const monthKey = (date: Date) => date.getFullYear() * 12 + date.getMonth()

/**
 * Step a view one month back or forward: ‹ October 2026 ›.
 *
 * Without `months` it moves one calendar month at a time and stops at the
 * current month. With `months` (e.g. the months that have transactions) it
 * steps only between those, and renders nothing when the list is empty.
 */
export function MonthSwitcher ({
  month,
  onChange,
  months,
  className
}: {
  month: Date
  onChange: (month: Date) => void
  months?: Date[]
  className?: string
}) {
  const { t, i18n } = useTranslation('common')

  const options = months
    ? [...months].sort((a, b) => monthKey(a) - monthKey(b))
    : null
  if (options && options.length === 0) return null

  const current = monthKey(month)
  const previous = options
    ? [...options].reverse().find(option => monthKey(option) < current)
    : new Date(month.getFullYear(), month.getMonth() - 1, 1)
  const next = options
    ? options.find(option => monthKey(option) > current)
    : current < monthKey(new Date())
      ? new Date(month.getFullYear(), month.getMonth() + 1, 1)
      : undefined

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant='outline'
        size='icon'
        className='h-8 w-8'
        onClick={() => previous && onChange(previous)}
        disabled={!previous}
        aria-label={t('common.back')}
      >
        <ChevronLeftIcon className='h-4 w-4' />
      </Button>
      <span
        className='min-w-[9rem] text-center text-sm font-medium capitalize'
        aria-live='polite'
      >
        {month.toLocaleDateString(i18n.language === 'ua' ? 'uk-UA' : 'en-US', {
          month: 'long',
          year: 'numeric'
        })}
      </span>
      <Button
        variant='outline'
        size='icon'
        className='h-8 w-8'
        onClick={() => next && onChange(next)}
        disabled={!next}
        aria-label={t('common.next')}
      >
        <ChevronRightIcon className='h-4 w-4' />
      </Button>
    </div>
  )
}
