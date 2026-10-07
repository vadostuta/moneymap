'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CalendarClock, CheckCircle2, CircleDot, Plus } from 'lucide-react'
import { planService } from '@/lib/services/plan'
import { usePrivacy } from '@/contexts/privacy-context'
import { MonthlyPlan } from '@/lib/types/plan'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { PlanTabs } from './PlanTabs'
import { HistoryChart } from './HistoryChart'
import { formatMonth } from './format'
import {
  addMonths,
  currentMonth,
  lineStatus,
  monthToParam,
  nextMonthToPlan,
  planTotals
} from './plan'

const PICKER_RANGE = 12

type MonthState = 'closed' | 'due' | 'open'

// A month is due for its checkpoint once it is over and still open
function monthState (plan: MonthlyPlan): MonthState {
  if (plan.closed_at) return 'closed'
  return plan.month < currentMonth() ? 'due' : 'open'
}

const STATE = {
  closed: {
    icon: CheckCircle2,
    className: 'text-green-700 bg-green-500/10 dark:text-green-400'
  },
  due: {
    icon: CalendarClock,
    className: 'text-amber-700 bg-amber-500/10 dark:text-amber-400'
  },
  open: { icon: CircleDot, className: 'text-muted-foreground bg-muted' }
}

function MonthCard ({ plan }: { plan: MonthlyPlan }) {
  const { t, i18n } = useTranslation('common')
  const { formatBalance } = usePrivacy()

  const lines = plan.lines ?? []
  const totals = planTotals(plan.incomes ?? [], lines)
  const state = monthState(plan)
  const StateIcon = STATE[state].icon
  const onPlan = lines.filter(
    line => lineStatus(line, totals.income) === 'on'
  ).length

  return (
    <Link href={`/plan/${monthToParam(plan.month)}`} className='block'>
      <Card className='h-full transition-colors hover:bg-accent/40'>
        <CardContent className='pt-5 space-y-3'>
          <div className='flex items-start justify-between gap-2'>
            <h2 className='font-semibold capitalize'>
              {formatMonth(plan.month, i18n.language)}
            </h2>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                STATE[state].className
              )}
            >
              <StateIcon className='h-3 w-3' />
              {t(`plan.list.state.${state}`)}
            </span>
          </div>

          <dl className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm'>
            <dt className='text-muted-foreground'>{t('plan.totals.income')}</dt>
            <dd className='text-right tabular-nums'>
              {formatBalance(totals.income, plan.currency)}
            </dd>
            <dt className='text-muted-foreground'>{t('plan.totals.leftover')}</dt>
            <dd
              className={cn(
                'text-right tabular-nums font-medium',
                totals.leftover < 0 && 'text-destructive'
              )}
            >
              {formatBalance(totals.leftover, plan.currency)}
            </dd>
            {totals.checked > 0 && (
              <>
                <dt className='text-muted-foreground'>
                  {t('plan.list.actualLeftover')}
                </dt>
                <dd className='text-right tabular-nums font-medium'>
                  {formatBalance(totals.actualLeftover, plan.currency)}
                </dd>
              </>
            )}
          </dl>

          {totals.checked > 0 && (
            <p className='text-xs text-muted-foreground'>
              {t('plan.list.onPlan', { count: onPlan, total: lines.length })}
            </p>
          )}
          {plan.note && (
            <p className='text-xs text-muted-foreground truncate'>{plan.note}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export default function PlanClient () {
  const { t, i18n } = useTranslation('common')
  const router = useRouter()

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: planService.getAll
  })

  const next = nextMonthToPlan(plans)
  const planned = new Set(plans.map(plan => plan.month))
  // A year back and a year ahead, newest first
  const now = currentMonth()
  const pickerMonths = Array.from({ length: PICKER_RANGE * 2 + 1 }, (_, i) =>
    addMonths(now, PICKER_RANGE - i)
  )

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h1 className='text-lg sm:text-xl md:text-2xl font-bold'>
          {t('plan.title')}
        </h1>
        <PlanTabs />
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <Button asChild>
          <Link href={`/plan/${monthToParam(next)}`}>
            <Plus className='h-4 w-4 mr-1' />
            {t('plan.list.planMonth', {
              month: formatMonth(next, i18n.language)
            })}
          </Link>
        </Button>
        <Select
          value=''
          onValueChange={month => router.push(`/plan/${monthToParam(month)}`)}
        >
          <SelectTrigger className='w-auto min-w-48'>
            <SelectValue placeholder={t('plan.list.openMonth')} />
          </SelectTrigger>
          <SelectContent>
            {pickerMonths.map(month => (
              <SelectItem key={month} value={month}>
                <span className='capitalize'>
                  {formatMonth(month, i18n.language)}
                </span>
                {planned.has(month) && (
                  <span className='text-muted-foreground'>
                    {' '}· {t('plan.list.planned')}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='h-36 bg-muted animate-pulse rounded-lg' />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className='pt-6 space-y-2'>
            <p className='font-medium'>{t('plan.list.emptyTitle')}</p>
            <p className='text-sm text-muted-foreground'>
              {t('plan.list.emptyText')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <HistoryChart plans={plans} />
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {plans.map(plan => (
              <MonthCard key={plan.id} plan={plan} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
