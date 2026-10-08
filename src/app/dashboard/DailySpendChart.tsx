'use client'

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { usePrivacy } from '@/contexts/privacy-context'
import { CurrencyType } from '@/lib/types/wallet'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip
} from '@/components/ui/chart'
import { DailyRow } from '../home/home'

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
})

// Running total spent this month as an area that stops at today, against the
// plan's even pace as a dashed line from 0 to the planned spend
export function DailySpendChart ({
  rows,
  currency,
  today
}: {
  rows: DailyRow[]
  currency: CurrencyType
  today: number
}) {
  const { t, i18n } = useTranslation('common')
  const { formatBalance, isHidden } = usePrivacy()
  const hasPace = rows.some(row => row.pace !== null)

  const config: ChartConfig = {
    spent: { label: t('home.dashboard.spent'), color: 'hsl(var(--chart-1))' },
    pace: {
      label: t('home.dashboard.pace'),
      color: 'hsl(var(--muted-foreground))'
    }
  }

  // Day ticks every 5 days, plus the last day
  const ticks = rows
    .map(row => row.day)
    .filter(day => day === 1 || day % 5 === 0 || day === rows.length)

  const dayLabel = (day: number) => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), day).toLocaleDateString(
      i18n.language === 'ua' ? 'uk-UA' : 'en-US',
      { day: 'numeric', month: 'short' }
    )
  }

  return (
    <div className='space-y-2'>
      <ChartContainer config={config} className='aspect-auto h-64 w-full'>
        <ComposedChart
          data={rows}
          margin={{ top: 8, right: 8, left: 8, bottom: 4 }}
        >
          <defs>
            <linearGradient id='spent-fill' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='var(--color-spent)' stopOpacity={0.35} />
              <stop offset='100%' stopColor='var(--color-spent)' stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray='3 3' />
          <XAxis
            dataKey='day'
            type='number'
            domain={[1, rows.length]}
            ticks={ticks}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickFormatter={value => (isHidden ? '' : compact.format(value))}
            tickLine={false}
            axisLine={false}
            width={isHidden ? 8 : 48}
          />
          <ReferenceLine
            x={today}
            stroke='hsl(var(--foreground))'
            strokeOpacity={0.4}
            label={{
              value: t('home.dashboard.today'),
              position: 'insideTopRight',
              className: 'fill-muted-foreground text-[11px]'
            }}
          />
          <ChartTooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as DailyRow | undefined
              if (!active || !row) return null
              return (
                <div className='rounded-lg border bg-background px-3 py-2 text-xs shadow-md space-y-0.5'>
                  <p className='text-muted-foreground'>{dayLabel(row.day)}</p>
                  {row.spent !== null && (
                    <p className='tabular-nums text-foreground'>
                      {t('home.dashboard.spent')}:{' '}
                      <span className='font-medium'>
                        {formatBalance(row.spent, currency)}
                      </span>
                    </p>
                  )}
                  {row.pace !== null && (
                    <p className='tabular-nums text-muted-foreground'>
                      {t('home.dashboard.pace')}:{' '}
                      {formatBalance(row.pace, currency)}
                    </p>
                  )}
                </div>
              )
            }}
          />
          <Area
            dataKey='spent'
            type='monotone'
            stroke='var(--color-spent)'
            strokeWidth={2}
            fill='url(#spent-fill)'
            connectNulls={false}
            isAnimationActive={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
          />
          {hasPace && (
            <Line
              dataKey='pace'
              type='linear'
              stroke='var(--color-pace)'
              strokeWidth={1.5}
              strokeDasharray='5 4'
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ChartContainer>

      <ul className='flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground'>
        <li className='flex items-center gap-2'>
          <span className='h-2.5 w-2.5 rounded-sm bg-[hsl(var(--chart-1))]' />
          {t('home.dashboard.spent')}
        </li>
        {hasPace && (
          <li className='flex items-center gap-2'>
            <span className='w-4 border-t-2 border-dashed border-muted-foreground' />
            {t('home.dashboard.paceLegend')}
          </li>
        )}
      </ul>
    </div>
  )
}
