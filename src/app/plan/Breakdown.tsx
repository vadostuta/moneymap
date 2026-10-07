'use client'

import { useTranslation } from 'react-i18next'
import { usePrivacy } from '@/contexts/privacy-context'

const COLORS = [1, 2, 3, 4, 5].map(n => `hsl(var(--chart-${n}))`)

export const lineColor = (index: number) => COLORS[index % COLORS.length]

// Income split into its lines and the leftover, as one stacked bar with a
// legend that carries the numbers (the bar alone is never the only cue)
export function Breakdown ({
  currency,
  income,
  items
}: {
  currency: string
  income: number
  items: { label: string; amount: number }[]
}) {
  const { t } = useTranslation('common')
  const { formatBalance } = usePrivacy()

  const allocated = items.reduce((sum, item) => sum + Math.max(0, item.amount), 0)
  const leftover = income - allocated
  // Over-allocated plans are drawn against what is given away, not income
  const scale = Math.max(income, allocated)
  const width = (amount: number) =>
    scale > 0 ? `${(Math.max(0, amount) / scale) * 100}%` : '0%'
  const share = (amount: number) =>
    income > 0 ? `${Math.round((amount / income) * 100)}%` : '—'

  if (scale <= 0) return null

  return (
    <div className='space-y-3'>
      <div
        className='flex h-4 w-full overflow-hidden rounded-full bg-muted'
        role='img'
        aria-label={t('plan.breakdown.label')}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className='h-full border-r border-background last:border-r-0'
            style={{ width: width(item.amount), backgroundColor: lineColor(index) }}
          />
        ))}
        {leftover > 0 && (
          <div
            className='h-full bg-[repeating-linear-gradient(45deg,hsl(var(--muted-foreground)/0.35)_0_4px,transparent_4px_8px)]'
            style={{ width: width(leftover) }}
          />
        )}
      </div>
      <ul className='grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3'>
        {items.map((item, index) => (
          <li key={index} className='flex items-center gap-2 min-w-0'>
            <span
              className='h-2.5 w-2.5 shrink-0 rounded-sm'
              style={{ backgroundColor: lineColor(index) }}
            />
            <span className='truncate'>{item.label}</span>
            <span className='ml-auto tabular-nums text-muted-foreground whitespace-nowrap'>
              {formatBalance(item.amount, currency)} · {share(item.amount)}
            </span>
          </li>
        ))}
        <li className='flex items-center gap-2 min-w-0 font-medium'>
          <span className='h-2.5 w-2.5 shrink-0 rounded-sm border border-muted-foreground/60 bg-[repeating-linear-gradient(45deg,hsl(var(--muted-foreground)/0.35)_0_2px,transparent_2px_4px)]' />
          <span className='truncate'>{t('plan.totals.leftover')}</span>
          <span className='ml-auto tabular-nums whitespace-nowrap'>
            {formatBalance(leftover, currency)} · {share(leftover)}
          </span>
        </li>
      </ul>
    </div>
  )
}
