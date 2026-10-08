'use client'

import { useTranslation } from 'react-i18next'
import { CheckCircle2, Coffee, Home, Search, ShoppingCart, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/app/plan/StatusBadge'

// Illustrations of the app with made-up numbers. They are decorative, so they
// are hidden from screen readers; the copy next to each one says the same thing.

function Frame ({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'select-none overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xl shadow-black/5 dark:shadow-black/40',
        className
      )}
    >
      <div className='flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5'>
        <span className='h-2.5 w-2.5 rounded-full bg-muted-foreground/25' />
        <span className='h-2.5 w-2.5 rounded-full bg-muted-foreground/25' />
        <span className='h-2.5 w-2.5 rounded-full bg-muted-foreground/25' />
      </div>
      <div className='p-4 sm:p-5'>{children}</div>
    </div>
  )
}

function Stat ({
  label,
  value,
  note
}: {
  label: string
  value: string
  note?: string
}) {
  return (
    <div className='rounded-xl border bg-background p-3'>
      <p className='text-xs text-muted-foreground'>{label}</p>
      <p className='mt-1 text-lg font-semibold tabular-nums sm:text-xl'>
        {value}
      </p>
      {note && <p className='text-[11px] text-muted-foreground'>{note}</p>}
    </div>
  )
}

const MONTHLY_SPENDING = [62, 74, 58, 81, 69, 77, 64, 71, 55, 68, 73, 60]

export function HeroPreview () {
  const { t } = useTranslation('common')
  const max = Math.max(...MONTHLY_SPENDING)

  return (
    <Frame>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <Stat
          label={t('about.preview.netWorth')}
          value='€24,180'
          note={`+3.2% ${t('about.preview.vsLastMonth')}`}
        />
        <Stat label={t('about.preview.freeToSpend')} value='€6,420' />
        <Stat label={t('about.preview.leftThisMonth')} value='€740' />
      </div>

      <div className='mt-4 rounded-xl border bg-background p-3'>
        <div className='mb-3 flex items-baseline justify-between'>
          <p className='text-xs text-muted-foreground'>
            {t('about.preview.spendingByMonth')}
          </p>
          <p className='text-xs font-medium tabular-nums'>€1,840</p>
        </div>
        <div className='flex h-28 items-end gap-[2px] sm:h-36'>
          {MONTHLY_SPENDING.map((value, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-t',
                i === MONTHLY_SPENDING.length - 1
                  ? 'bg-[hsl(var(--chart-1))]'
                  : 'bg-[hsl(var(--chart-1)/0.35)]'
              )}
              style={{ height: `${(value / max) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </Frame>
  )
}

export function TrackPreview () {
  const { t } = useTranslation('common')
  const rows = [
    { icon: ShoppingCart, label: t('about.preview.groceries'), source: 'Monobank', amount: '−₴1,240' },
    { icon: Coffee, label: t('about.preview.coffee'), source: 'Monobank', amount: '−₴95' },
    { icon: Wallet, label: t('about.preview.salary'), source: 'Privat24', amount: '+₴62,000' },
    { icon: Home, label: t('about.preview.rent'), source: 'Cash', amount: '−₴18,000' }
  ]

  return (
    <Frame>
      <div className='mb-3 flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground'>
        <Search className='h-4 w-4' />
        {t('about.preview.searchPlaceholder')}
      </div>
      <ul className='divide-y rounded-xl border bg-background'>
        {rows.map(row => (
          <li key={row.label} className='flex items-center gap-3 px-3 py-2.5'>
            <span className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted'>
              <row.icon className='h-4 w-4 text-muted-foreground' />
            </span>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>{row.label}</p>
              <p className='text-[11px] text-muted-foreground'>{row.source}</p>
            </div>
            <p className='text-sm font-medium tabular-nums'>{row.amount}</p>
          </li>
        ))}
      </ul>
    </Frame>
  )
}

export function PlanPreview () {
  const { t } = useTranslation('common')
  const lines = [
    { label: t('about.preview.rent'), planned: 800, actual: 800, status: 'on', flow: 'spend' },
    { label: t('about.preview.groceries'), planned: 400, actual: 430, status: 'over', flow: 'spend' },
    { label: t('about.preview.investments'), planned: 450, actual: 480, status: 'over', flow: 'save' }
  ] as const

  return (
    <Frame>
      <ul className='space-y-4'>
        {lines.map(line => (
          <li key={line.label}>
            <div className='mb-1.5 flex items-center justify-between gap-2'>
              <p className='text-sm font-medium'>{line.label}</p>
              <StatusBadge status={line.status} flow={line.flow} />
            </div>
            <div className='h-2 overflow-hidden rounded-full bg-muted'>
              <div
                className='h-full rounded-full bg-[hsl(var(--chart-1))]'
                style={{ width: `${Math.min(line.actual / line.planned, 1) * 100}%` }}
              />
            </div>
            <p className='mt-1 text-[11px] tabular-nums text-muted-foreground'>
              €{line.actual} / €{line.planned} {t('about.preview.planned')}
            </p>
          </li>
        ))}
      </ul>
      <div className='mt-4 flex items-center justify-between rounded-xl border bg-background px-3 py-2.5'>
        <p className='text-sm text-muted-foreground'>
          {t('about.preview.leftover')}
        </p>
        <p className='text-base font-semibold tabular-nums'>€740</p>
      </div>
    </Frame>
  )
}

// Net worth over twelve snapshots, in thousands of euro
const NET_WORTH = [17.2, 17.9, 18.4, 18.1, 19.3, 20.0, 20.6, 21.4, 21.1, 22.5, 23.4, 24.2]

function NetWorthLine () {
  const width = 300
  const height = 90
  const min = Math.min(...NET_WORTH) - 1
  const max = Math.max(...NET_WORTH) + 0.5
  const points = NET_WORTH.map((value, i) => [
    (i / (NET_WORTH.length - 1)) * width,
    height - ((value - min) / (max - min)) * height
  ])
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const [lastX, lastY] = points[points.length - 1]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className='h-24 w-full overflow-visible'>
      <path
        d={`${line} L${width},${height} L0,${height} Z`}
        className='fill-[hsl(var(--chart-1)/0.12)]'
      />
      <path
        d={line}
        fill='none'
        strokeWidth={2}
        strokeLinejoin='round'
        strokeLinecap='round'
        vectorEffect='non-scaling-stroke'
        className='stroke-[hsl(var(--chart-1))]'
      />
      <circle
        cx={lastX}
        cy={lastY}
        r={4}
        strokeWidth={2}
        className='fill-[hsl(var(--chart-1))] stroke-card'
      />
    </svg>
  )
}

export function GrowPreview () {
  const { t } = useTranslation('common')
  const liquid = 9800
  const earmarked = 3380
  const free = liquid - earmarked

  return (
    <Frame>
      <div className='flex items-baseline justify-between'>
        <p className='text-xs text-muted-foreground'>
          {t('about.preview.netWorth')}
        </p>
        <p className='text-lg font-semibold tabular-nums'>€24,180</p>
      </div>
      <NetWorthLine />

      <div className='mt-4 rounded-xl border bg-background p-3'>
        <div className='mb-2 flex items-baseline justify-between text-xs'>
          <span className='text-muted-foreground'>{t('about.preview.liquid')}</span>
          <span className='font-medium tabular-nums'>€9,800</span>
        </div>
        <div className='flex h-3 gap-[2px]'>
          <div
            className='rounded-l bg-[hsl(var(--chart-1))]'
            style={{ width: `${(earmarked / liquid) * 100}%` }}
          />
          <div className='flex-1 rounded-r bg-[hsl(var(--chart-2))]' />
        </div>
        <div className='mt-2 flex justify-between text-[11px]'>
          <span className='flex items-center gap-1.5 text-muted-foreground'>
            <span className='h-2 w-2 rounded-sm bg-[hsl(var(--chart-1))]' />
            {t('about.preview.earmarked')}
            <span className='font-medium tabular-nums text-foreground'>€3,380</span>
          </span>
          <span className='flex items-center gap-1.5 text-muted-foreground'>
            <span className='h-2 w-2 rounded-sm bg-[hsl(var(--chart-2))]' />
            {t('about.preview.freeToSpend')}
            <span className='font-medium tabular-nums text-foreground'>
              €{free.toLocaleString('en-US')}
            </span>
          </span>
        </div>
      </div>

      <div className='mt-3 rounded-xl border bg-background p-3'>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <p className='text-sm font-medium'>
            {t('about.preview.goalCar')}{' '}
            <span className='font-normal text-muted-foreground'>
              · {t('about.preview.goalBy')}
            </span>
          </p>
          <span className='inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400'>
            <CheckCircle2 className='h-3 w-3' />
            {t('about.preview.onPace')}
          </span>
        </div>
        <div className='h-2 overflow-hidden rounded-full bg-muted'>
          <div className='h-full w-[30%] rounded-full bg-[hsl(var(--chart-1))]' />
        </div>
        <p className='mt-1 text-[11px] tabular-nums text-muted-foreground'>
          €6,000 / €20,000
        </p>
      </div>
    </Frame>
  )
}
