'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import { usePrivacy } from '@/contexts/privacy-context'
import { MonthlyPlan } from '@/lib/types/plan'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip
} from '@/components/ui/chart'
import { formatMonth, formatShortMonth } from './format'
import { planTotals } from './plan'

interface Row {
  month: string
  planned: number
  actual?: number
}

const MAX_MONTHS = 12

// Planned leftover (neutral) against what was actually left (checked months
// only), for the last year of plans in the latest plan's currency
export function HistoryChart ({ plans }: { plans: MonthlyPlan[] }) {
  const { t, i18n } = useTranslation('common')
  const { formatBalance, isHidden } = usePrivacy()

  const currency = plans[0]?.currency
  const inCurrency = plans.filter(plan => plan.currency === currency)
  const rows: Row[] = inCurrency
    .slice(0, MAX_MONTHS)
    .reverse()
    .map(plan => {
      const totals = planTotals(plan.incomes ?? [], plan.lines ?? [])
      return {
        month: plan.month,
        planned: totals.leftover,
        actual: totals.checked > 0 ? totals.actualLeftover : undefined
      }
    })

  if (rows.length < 2) return null

  const config: ChartConfig = {
    planned: {
      label: t('plan.history.planned'),
      color: 'hsl(var(--muted-foreground) / 0.45)'
    },
    actual: { label: t('plan.history.actual'), color: 'hsl(var(--chart-1))' }
  }

  const compact = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  })
  const skipped = plans.length - inCurrency.length

  return (
    <Card>
      <CardContent className='pt-5 space-y-2'>
        <div>
          <h2 className='text-sm font-medium'>{t('plan.history.title')}</h2>
          <p className='text-xs text-muted-foreground'>
            {t('plan.history.hint', { currency })}
            {skipped > 0 && ` ${t('plan.history.skipped', { count: skipped })}`}
          </p>
        </div>
        <ChartContainer config={config} className='aspect-auto h-48 w-full'>
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis
              dataKey='month'
              tickFormatter={month => formatShortMonth(month, i18n.language)}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickFormatter={value => (isHidden ? '' : compact.format(value))}
              tickLine={false}
              axisLine={false}
              width={isHidden ? 8 : 44}
            />
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as Row | undefined
                if (!active || !row) return null
                return (
                  <div className='rounded-lg border bg-background px-3 py-2 text-xs shadow-md space-y-0.5'>
                    <p className='text-muted-foreground capitalize'>
                      {formatMonth(row.month, i18n.language)}
                    </p>
                    <p className='tabular-nums'>
                      {t('plan.history.planned')}:{' '}
                      {formatBalance(row.planned, currency)}
                    </p>
                    <p className='tabular-nums'>
                      {t('plan.history.actual')}:{' '}
                      <span className='font-medium'>
                        {row.actual === undefined
                          ? t('plan.history.notChecked')
                          : formatBalance(row.actual, currency)}
                      </span>
                    </p>
                  </div>
                )
              }}
            />
            <Bar
              dataKey='planned'
              fill='var(--color-planned)'
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey='actual'
              fill='var(--color-actual)'
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
        <ul className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
          <li className='flex items-center gap-1.5'>
            <span className='h-2.5 w-2.5 rounded-sm bg-[hsl(var(--muted-foreground)/0.45)]' />
            {t('plan.history.planned')}
          </li>
          <li className='flex items-center gap-1.5'>
            <span className='h-2.5 w-2.5 rounded-sm bg-[hsl(var(--chart-1))]' />
            {t('plan.history.actual')}
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}
