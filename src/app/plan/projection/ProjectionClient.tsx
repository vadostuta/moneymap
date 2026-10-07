'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { planService } from '@/lib/services/plan'
import { usePrivacy } from '@/contexts/privacy-context'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip
} from '@/components/ui/chart'
import { PlanTabs } from '../PlanTabs'
import { lineColor } from '../Breakdown'
import { formatMonth, formatShortMonth } from '../format'
import {
  LEFTOVER_KEY,
  ProjectionSeries,
  addMonths,
  currentMonth,
  project,
  projectionSeries
} from '../plan'

const RANGES = [3, 6, 12, 24]
const LEFTOVER_COLOR = 'hsl(var(--muted-foreground))'

// What to show before the user picks: the kept money (save lines and the
// leftover)
const defaultKeys = (series: ProjectionSeries[]) =>
  series.filter(item => item.flow === 'save').map(item => item.key)

export default function ProjectionClient () {
  const { t, i18n } = useTranslation('common')
  const { formatBalance, isHidden } = usePrivacy()

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: planService.getAll
  })

  const [sourceId, setSourceId] = useState<string | null>(null)
  const [months, setMonths] = useState(12)
  // null until the user changes the selection; keys are per source plan
  const [picked, setPicked] = useState<string[] | null>(null)

  const source = plans.find(plan => plan.id === sourceId) ?? plans[0]

  const header = (
    <div className='flex flex-wrap items-center justify-between gap-2'>
      <h1 className='text-lg sm:text-xl md:text-2xl font-bold'>
        {t('plan.title')}
      </h1>
      <PlanTabs />
    </div>
  )

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {header}
        <div className='h-64 bg-muted animate-pulse rounded-lg' />
      </div>
    )
  }

  if (!source) {
    return (
      <div className='space-y-4 sm:space-y-6'>
        {header}
        <Card>
          <CardContent className='pt-6 text-sm text-muted-foreground'>
            {t('plan.projection.empty')}{' '}
            <Link href='/plan' className='underline underline-offset-4'>
              {t('plan.projection.emptyLink')}
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const series = projectionSeries(source).map(item =>
    item.key === LEFTOVER_KEY
      ? { ...item, label: t('plan.totals.leftover') }
      : item
  )
  const selectedKeys = picked ?? defaultKeys(series)
  const selected = series.filter(item => selectedKeys.includes(item.key))
  const colorOf = (key: string) =>
    key === LEFTOVER_KEY
      ? LEFTOVER_COLOR
      : lineColor(series.findIndex(item => item.key === key))

  // Projection starts with this month, or the source month if that is later:
  // what is ahead, not what is already behind
  const now = currentMonth()
  const start = source.month > now ? source.month : now
  const rows = project(selected, start, months)
  const last = rows[rows.length - 1]
  const currency = source.currency

  const toggle = (key: string, on: boolean) =>
    setPicked(
      on ? [...selectedKeys, key] : selectedKeys.filter(item => item !== key)
    )

  const config: ChartConfig = Object.fromEntries(
    selected.map(item => [item.key, { label: item.label, color: colorOf(item.key) }])
  )
  const compact = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  })
  const chartRows = [
    { month: addMonths(start, -1), ...Object.fromEntries(selected.map(item => [item.key, 0])) },
    ...rows.map(row => ({ month: row.month, ...row.values }))
  ]

  return (
    <div className='space-y-4 sm:space-y-6'>
      {header}

      <Card>
        <CardContent className='pt-6 grid gap-4 sm:grid-cols-[auto_1fr]'>
          <div>
            <Label className='block mb-1'>{t('plan.projection.source')}</Label>
            <Select
              value={source.id}
              onValueChange={id => {
                setSourceId(id)
                setPicked(null)
              }}
            >
              <SelectTrigger className='w-full sm:w-52 capitalize'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id} className='capitalize'>
                    {formatMonth(plan.month, i18n.language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className='block mb-1'>{t('plan.projection.range')}</Label>
            <div className='inline-flex rounded-lg bg-muted p-1 text-sm' role='group'>
              {RANGES.map(range => (
                <button
                  key={range}
                  type='button'
                  aria-pressed={months === range}
                  onClick={() => setMonths(range)}
                  className={cn(
                    'rounded-md px-3 py-1.5 font-medium transition-colors',
                    months === range
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t('plan.projection.months', { count: range })}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-4 lg:grid-cols-[18rem_1fr]'>
        <Card>
          <CardContent className='pt-5 space-y-2'>
            <p className='text-sm font-medium'>{t('plan.projection.pick')}</p>
            {series.map(item => (
              <div key={item.key} className='flex items-center gap-2 text-sm'>
                <Checkbox
                  id={`series-${item.key}`}
                  checked={selectedKeys.includes(item.key)}
                  onCheckedChange={checked => toggle(item.key, checked === true)}
                />
                <span
                  className='h-2.5 w-2.5 shrink-0 rounded-sm'
                  style={{ backgroundColor: colorOf(item.key) }}
                />
                <Label htmlFor={`series-${item.key}`} className='truncate font-normal'>
                  {item.label}
                </Label>
                <span className='ml-auto tabular-nums text-muted-foreground whitespace-nowrap'>
                  {formatBalance(item.monthly, currency)}
                  {t('plan.projection.perMonth')}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className='space-y-4 min-w-0'>
          {selected.length === 0 ? (
            <Card>
              <CardContent className='pt-6 text-sm text-muted-foreground'>
                {t('plan.projection.nothingPicked')}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                {selected.map(item => (
                  <Card key={item.key}>
                    <CardContent className='pt-5'>
                      <p className='flex items-center gap-2 text-sm font-medium'>
                        <span
                          className='h-2.5 w-2.5 shrink-0 rounded-sm'
                          style={{ backgroundColor: colorOf(item.key) }}
                        />
                        <span className='truncate'>{item.label}</span>
                      </p>
                      <p className='text-2xl font-bold tabular-nums mt-1'>
                        {formatBalance(last.values[item.key], currency)}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {t(
                          item.flow === 'save'
                            ? 'plan.projection.accumulated'
                            : 'plan.projection.spent',
                          {
                            month: formatMonth(last.month, i18n.language),
                            count: months
                          }
                        )}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardContent className='pt-5 space-y-2'>
                  <p className='text-xs text-muted-foreground'>
                    {t('plan.projection.assumption', {
                      month: formatMonth(source.month, i18n.language)
                    })}
                  </p>
                  <ChartContainer config={config} className='aspect-auto h-64 w-full'>
                    <LineChart data={chartRows} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray='3 3' />
                      <XAxis
                        dataKey='month'
                        tickFormatter={month => formatShortMonth(month, i18n.language)}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={16}
                      />
                      <YAxis
                        tickFormatter={value => (isHidden ? '' : compact.format(value))}
                        tickLine={false}
                        axisLine={false}
                        width={isHidden ? 8 : 48}
                      />
                      <ChartTooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          const row = payload?.[0]?.payload as
                            | { month: string; [key: string]: number | string }
                            | undefined
                          if (!active || !row) return null
                          return (
                            <div className='rounded-lg border bg-background px-3 py-2 text-xs shadow-md space-y-0.5'>
                              <p className='text-muted-foreground capitalize'>
                                {formatMonth(row.month, i18n.language)}
                              </p>
                              {selected.map(item => (
                                <p key={item.key} className='flex items-center gap-1.5 tabular-nums'>
                                  <span
                                    className='h-2 w-2 rounded-sm'
                                    style={{ backgroundColor: colorOf(item.key) }}
                                  />
                                  {item.label}:{' '}
                                  <span className='font-medium'>
                                    {formatBalance(Number(row[item.key]), currency)}
                                  </span>
                                </p>
                              ))}
                            </div>
                          )
                        }}
                      />
                      {selected.map(item => (
                        <Line
                          key={item.key}
                          dataKey={item.key}
                          type='linear'
                          stroke={colorOf(item.key)}
                          strokeWidth={2}
                          strokeDasharray={item.key === LEFTOVER_KEY ? '5 4' : undefined}
                          dot={false}
                          isAnimationActive={false}
                        />
                      ))}
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='pt-5 overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='text-left text-xs text-muted-foreground'>
                        <th className='py-1 pr-4 font-medium'>
                          {t('plan.projection.month')}
                        </th>
                        {selected.map(item => (
                          <th key={item.key} className='py-1 pl-4 font-medium text-right'>
                            {item.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(row => (
                        <tr key={row.month} className='border-t'>
                          <td className='py-1.5 pr-4 capitalize whitespace-nowrap'>
                            {formatMonth(row.month, i18n.language)}
                          </td>
                          {selected.map(item => (
                            <td key={item.key} className='py-1.5 pl-4 text-right tabular-nums'>
                              {formatBalance(row.values[item.key], currency)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
