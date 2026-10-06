'use client'

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import { usePrivacy } from '@/contexts/privacy-context'
import { CurrencyType } from '@/lib/types/wallet'
import { WealthSnapshotSummary } from '@/lib/types/wealth'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip
} from '@/components/ui/chart'
import { formatShortDate, formatSnapshotDate, parseSnapshotDate } from './utils'

const MIN_POINT_SPACING_PX = 72

interface NetWorthChartProps {
  series: WealthSnapshotSummary[]
  currency: CurrencyType
}

interface Point {
  time: number
  date: string
  netWorth: number
}

export function NetWorthChart ({ series, currency }: NetWorthChartProps) {
  const { t, i18n } = useTranslation('common')
  const { formatBalance, isHidden } = usePrivacy()

  const config: ChartConfig = {
    netWorth: { label: t('wealth.totals.netWorth'), color: 'hsl(var(--chart-1))' }
  }

  const data: Point[] = series.map(snapshot => ({
    time: parseSnapshotDate(snapshot.snapshot_date).getTime(),
    date: snapshot.snapshot_date,
    netWorth: snapshot.net_worth
  }))
  const lastIndex = data.length - 1

  const compact = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  })

  return (
    // The chart scrolls inside its own box on narrow screens; the page never does
    <div className='overflow-x-auto'>
      <div style={{ minWidth: data.length * MIN_POINT_SPACING_PX }}>
        <ChartContainer config={config} className='aspect-auto h-64 w-full'>
          <LineChart data={data} margin={{ top: 28, right: 56, left: 8, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis
              dataKey='time'
              type='number'
              scale='time'
              domain={['dataMin', 'dataMax']}
              ticks={data.map(point => point.time)}
              tickFormatter={time => formatShortDate(new Date(time), i18n.language)}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={value => (isHidden ? '' : compact.format(value))}
              tickLine={false}
              axisLine={false}
              width={isHidden ? 8 : 48}
            />
            <ChartTooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as Point | undefined
                if (!active || !point) return null
                return (
                  <div className='rounded-lg border bg-background px-3 py-2 text-xs shadow-md'>
                    <p className='text-muted-foreground'>
                      {formatSnapshotDate(point.date, i18n.language)}
                    </p>
                    <p className='font-medium tabular-nums text-foreground'>
                      {formatBalance(point.netWorth, currency)}
                    </p>
                  </div>
                )
              }}
            />
            <Line
              dataKey='netWorth'
              type='monotone'
              stroke='var(--color-netWorth)'
              strokeWidth={2}
              isAnimationActive={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
              dot={props => {
                const { cx, cy, index } = props as {
                  cx: number
                  cy: number
                  index: number
                }
                if (index !== lastIndex) return <g key={index} />
                return (
                  <g key={index}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill='var(--color-netWorth)'
                      stroke='hsl(var(--background))'
                      strokeWidth={2}
                    />
                    <text
                      x={cx}
                      y={cy - 12}
                      textAnchor='middle'
                      className='fill-foreground text-xs font-medium tabular-nums'
                    >
                      {formatBalance(data[index].netWorth, currency)}
                    </text>
                  </g>
                )
              }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  )
}
