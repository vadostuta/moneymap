'use client'

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import { usePrivacy } from '@/contexts/privacy-context'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip
} from '@/components/ui/chart'
import { formatShortDate, formatSnapshotDate, parseSnapshotDate } from '../utils'
import { Goal } from './goals'

interface Row {
  time: number
  date: string
  actual?: number
  needed: number
}

// Actual amounts (solid) against the straight path from the first point to
// the target on the target date (dashed, neutral)
export function GoalChart ({ goal }: { goal: Goal }) {
  const { t, i18n } = useTranslation('common')
  const { formatBalance, isHidden } = usePrivacy()

  const first = goal.points[0]
  const startTime = parseSnapshotDate(first.date).getTime()
  const endTime = parseSnapshotDate(goal.targetDate).getTime()
  const neededAt = (time: number) =>
    first.amount +
    ((goal.target - first.amount) * (time - startTime)) / (endTime - startTime)

  const rows: Row[] = [
    ...goal.points.map(point => {
      const time = parseSnapshotDate(point.date).getTime()
      return { time, date: point.date, actual: point.amount, needed: neededAt(time) }
    }),
    { time: endTime, date: goal.targetDate, needed: goal.target }
  ]

  const config: ChartConfig = {
    actual: { label: t('wealth.goals.chartActual'), color: 'hsl(var(--chart-1))' },
    needed: {
      label: t('wealth.goals.chartNeeded'),
      color: 'hsl(var(--muted-foreground))'
    }
  }

  const compact = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  })

  return (
    <div className='space-y-2'>
      <ChartContainer config={config} className='aspect-auto h-40 w-full'>
        <LineChart data={rows} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray='3 3' />
          <XAxis
            dataKey='time'
            type='number'
            scale='time'
            domain={[startTime, endTime]}
            ticks={[startTime, endTime]}
            tickFormatter={time =>
              formatShortDate(new Date(time), i18n.language)}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            domain={[0, 'auto']}
            tickFormatter={value => (isHidden ? '' : compact.format(value))}
            tickLine={false}
            axisLine={false}
            width={isHidden ? 8 : 44}
          />
          <ChartTooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as Row | undefined
              if (!active || !row) return null
              return (
                <div className='rounded-lg border bg-background px-3 py-2 text-xs shadow-md space-y-0.5'>
                  <p className='text-muted-foreground'>
                    {formatSnapshotDate(row.date, i18n.language)}
                  </p>
                  {row.actual !== undefined && (
                    <p className='tabular-nums'>
                      {t('wealth.goals.chartActual')}:{' '}
                      <span className='font-medium'>
                        {formatBalance(row.actual, goal.currency)}
                      </span>
                    </p>
                  )}
                  <p className='tabular-nums text-muted-foreground'>
                    {t('wealth.goals.chartNeeded')}:{' '}
                    {formatBalance(row.needed, goal.currency)}
                  </p>
                </div>
              )
            }}
          />
          <Line
            dataKey='needed'
            type='linear'
            stroke='var(--color-needed)'
            strokeWidth={1.5}
            strokeDasharray='5 4'
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey='actual'
            type='linear'
            stroke='var(--color-actual)'
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-actual)', strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
      <ul className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
        <li className='flex items-center gap-1.5'>
          <span className='h-0.5 w-4 rounded bg-[hsl(var(--chart-1))]' />
          {t('wealth.goals.chartActual')}
        </li>
        <li className='flex items-center gap-1.5'>
          <span className='w-4 border-t-2 border-dashed border-muted-foreground' />
          {t('wealth.goals.chartNeeded')}
        </li>
      </ul>
    </div>
  )
}
