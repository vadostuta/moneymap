'use client'

// Template widgets for wealth, goals, the monthly plan and the month summary.
// Wealth and goal widgets only read snapshots and claims, never transactions
// (see plans/wealth/00-overview.md), so they ignore the wallet and category
// the template is filtered by.

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePrivacy } from '@/contexts/privacy-context'
import { Card, CardContent } from '@/components/ui/card'
import { transactionService } from '@/lib/services/transaction'
import { wealthService } from '@/lib/services/wealth'
import { claimService } from '@/lib/services/claim'
import { planService } from '@/lib/services/plan'
import { buildHistory } from '@/app/wealth/history'
import { formatShortDate, formatSnapshotDate } from '@/app/wealth/utils'
import { NetWorthChart } from '@/app/wealth/NetWorthChart'
import { buildGoals } from '@/app/wealth/goals/goals'
import { GoalStatusBadge } from '@/app/wealth/goals/GoalStatusBadge'
import { Breakdown } from '@/app/plan/Breakdown'
import { HistoryChart } from '@/app/plan/HistoryChart'
import { formatMonth } from '@/app/plan/format'
import {
  lineAmount,
  lineStatus,
  monthKey,
  monthToParam,
  planTotals
} from '@/app/plan/plan'

const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1
})

function WidgetCard ({
  title,
  href,
  children
}: {
  title: string
  href?: string
  children: React.ReactNode
}) {
  const { t } = useTranslation('common')

  return (
    <Card className='h-full'>
      <CardContent className='pt-5 space-y-3'>
        <div className='flex items-center justify-between gap-2'>
          <h2 className='text-sm font-medium'>{title}</h2>
          {href && (
            <Link
              href={href}
              className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
            >
              {t('templates.widgets.open')}
              <ArrowRight className='h-3 w-3' />
            </Link>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function WidgetSkeleton () {
  return <div className='h-32 bg-muted animate-pulse rounded-lg' />
}

function Empty ({
  text,
  href,
  action
}: {
  text: string
  href: string
  action: string
}) {
  return (
    <div className='py-6 text-center space-y-2'>
      <p className='text-sm text-muted-foreground'>{text}</p>
      <Link href={href} className='text-sm underline underline-offset-4'>
        {action}
      </Link>
    </div>
  )
}

// ─── Spending ───────────────────────────────────────────────────────────────

export function MonthSummaryWidget ({
  walletId,
  currency,
  month
}: {
  walletId?: string
  currency: string
  month: Date
}) {
  const { t } = useTranslation('common')
  const { formatAmount } = usePrivacy()
  const year = month.getFullYear()
  const monthIndex = month.getMonth()

  const { data, isLoading } = useQuery({
    queryKey: ['template-month-summary', walletId, year, monthIndex],
    queryFn: async () => {
      const [income, expenses] = await Promise.all([
        transactionService.getMonthlyIncomeByCategory(
          walletId ?? 'all',
          year,
          monthIndex
        ),
        transactionService.getMonthlyExpensesByCategory(
          walletId ?? 'all',
          year,
          monthIndex
        )
      ])
      const sum = (rows: { amount: number }[]) =>
        rows.reduce((total, row) => total + row.amount, 0)
      return { income: sum(income), expenses: sum(expenses) }
    }
  })

  const income = data?.income ?? 0
  const expenses = data?.expenses ?? 0
  const net = income - expenses
  const savingsRate = income > 0 ? net / income : null

  return (
    <WidgetCard title={t('components.monthSummary.name')}>
      {isLoading ? (
        <WidgetSkeleton />
      ) : (
        <dl className='grid grid-cols-2 gap-4'>
          <Stat
            label={t('report.cards.income')}
            value={formatAmount(income, currency)}
            className='text-green-600 dark:text-green-500'
          />
          <Stat
            label={t('report.cards.expenses')}
            value={formatAmount(expenses, currency)}
            className='text-red-600 dark:text-red-500'
          />
          <Stat
            label={t('report.cards.net')}
            value={formatAmount(net, currency)}
            className={net < 0 ? 'text-destructive' : undefined}
          />
          <Stat
            label={t('report.cards.savingsRate')}
            value={savingsRate === null ? '—' : percent.format(savingsRate)}
          />
        </dl>
      )}
    </WidgetCard>
  )
}

function Stat ({
  label,
  value,
  sub,
  className
}: {
  label: string
  value: string
  sub?: React.ReactNode
  className?: string
}) {
  return (
    <div className='min-w-0'>
      <dt className='text-xs text-muted-foreground'>{label}</dt>
      <dd
        className={cn(
          'text-lg sm:text-xl font-bold tabular-nums [overflow-wrap:anywhere]',
          className
        )}
      >
        {value}
      </dd>
      {sub && <dd className='text-xs text-muted-foreground'>{sub}</dd>}
    </div>
  )
}

// ─── Wealth ─────────────────────────────────────────────────────────────────

function useWealthHistory () {
  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['wealth-snapshots'],
    queryFn: wealthService.getAll
  })
  return { history: buildHistory(snapshots), isLoading }
}

export function NetWorthWidget () {
  const { t, i18n } = useTranslation('common')
  const { formatBalance } = usePrivacy()
  const { history, isLoading } = useWealthHistory()
  const { latest, previous, currency } = history

  return (
    <WidgetCard title={t('components.netWorth.name')} href='/wealth'>
      {isLoading ? (
        <WidgetSkeleton />
      ) : !latest || !currency ? (
        <Empty
          text={t('wealth.list.emptyTitle')}
          href='/wealth/new'
          action={t('wealth.list.emptyAction')}
        />
      ) : (
        <>
          <dl>
            <Stat
              label={t('templates.widgets.asOf', {
                date: formatSnapshotDate(latest.snapshot_date, i18n.language)
              })}
              value={formatBalance(latest.net_worth, currency)}
              sub={
                previous && previous.net_worth !== 0 ? (
                  <span
                    className={
                      latest.net_worth >= previous.net_worth
                        ? 'text-green-600 dark:text-green-500'
                        : 'text-red-600 dark:text-red-500'
                    }
                  >
                    {latest.net_worth >= previous.net_worth ? '▲' : '▼'}{' '}
                    {t('wealth.history.vsPrevious', {
                      percent: percent.format(
                        Math.abs(
                          (latest.net_worth - previous.net_worth) /
                            Math.abs(previous.net_worth)
                        )
                      ),
                      date: formatShortDate(
                        previous.snapshot_date,
                        i18n.language
                      )
                    })}
                  </span>
                ) : (
                  t('wealth.history.firstSnapshot')
                )
              }
            />
          </dl>
          {history.series.length >= 2 ? (
            <NetWorthChart series={history.series} currency={currency} />
          ) : (
            <p className='text-xs text-muted-foreground'>
              {t('wealth.history.chartEmpty')}
            </p>
          )}
        </>
      )}
    </WidgetCard>
  )
}

export function FreeToSpendWidget () {
  const { t, i18n } = useTranslation('common')
  const { formatBalance } = usePrivacy()
  const { history, isLoading } = useWealthHistory()
  const { latest, currency } = history

  return (
    <WidgetCard title={t('components.freeToSpend.name')} href='/wealth'>
      {isLoading ? (
        <WidgetSkeleton />
      ) : !latest || !currency ? (
        <Empty
          text={t('wealth.list.emptyTitle')}
          href='/wealth/new'
          action={t('wealth.list.emptyAction')}
        />
      ) : (
        <dl className='space-y-4'>
          <Stat
            label={t('templates.widgets.asOf', {
              date: formatSnapshotDate(latest.snapshot_date, i18n.language)
            })}
            value={formatBalance(latest.free, currency)}
            className={latest.free < 0 ? 'text-destructive' : undefined}
            sub={
              latest.earmarked > 0
                ? t('wealth.history.freeHint', {
                    amount: formatBalance(latest.earmarked, currency)
                  })
                : t('wealth.history.freeNoClaims')
            }
          />
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <dt className='text-xs text-muted-foreground'>
                {t('wealth.totals.liquid')}
              </dt>
              <dd className='tabular-nums font-medium'>
                {formatBalance(latest.liquid, currency)}
              </dd>
            </div>
            <div>
              <dt className='text-xs text-muted-foreground'>
                {t('wealth.totals.claimed')}
              </dt>
              <dd className='tabular-nums font-medium'>
                {formatBalance(latest.earmarked, currency)}
              </dd>
            </div>
          </div>
        </dl>
      )}
    </WidgetCard>
  )
}

export function GoalsWidget () {
  const { t } = useTranslation('common')
  const { formatBalance } = usePrivacy()

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['wealth-snapshots'],
    queryFn: wealthService.getAll
  })
  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: claimService.getAll
  })
  const goals = buildGoals(claims, snapshots)

  return (
    <WidgetCard title={t('components.goalsProgress.name')} href='/wealth/goals'>
      {isLoading || claimsLoading ? (
        <WidgetSkeleton />
      ) : goals.length === 0 ? (
        <Empty
          text={t('wealth.goals.emptyTitle')}
          href='/claims'
          action={t('wealth.form.manageClaims')}
        />
      ) : (
        <ul className='space-y-4'>
          {goals.map(goal => (
            <li key={goal.claim.id} className='space-y-1.5'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-sm font-medium truncate'>
                  {goal.claim.name}
                </span>
                <GoalStatusBadge status={goal.status} />
              </div>
              <div
                className='h-2 rounded-full bg-muted overflow-hidden'
                role='progressbar'
                aria-label={goal.claim.name}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(Math.min(1, goal.progress) * 100)}
              >
                <div
                  className='h-full rounded-full bg-[hsl(var(--chart-1))]'
                  style={{ width: `${Math.min(1, goal.progress) * 100}%` }}
                />
              </div>
              <div className='flex justify-between gap-2 text-xs text-muted-foreground tabular-nums'>
                <span>
                  {formatBalance(goal.current, goal.currency)}{' '}
                  {t('wealth.goals.of', {
                    target: formatBalance(goal.target, goal.currency)
                  })}
                </span>
                <span>{percent.format(goal.progress)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}

// ─── Plan ───────────────────────────────────────────────────────────────────

function usePlans () {
  return useQuery({ queryKey: ['plans'], queryFn: planService.getAll })
}

export function MonthPlanWidget ({ month }: { month: Date }) {
  const { t, i18n } = useTranslation('common')
  const { formatBalance } = usePrivacy()
  const { data: plans = [], isLoading } = usePlans()

  const key = monthKey(month.getFullYear(), month.getMonth() + 1)
  const plan = plans.find(p => p.month === key)
  const href = `/plan/${monthToParam(key)}`
  const monthName = formatMonth(key, i18n.language)

  if (isLoading) {
    return (
      <WidgetCard title={t('components.monthPlan.name')}>
        <WidgetSkeleton />
      </WidgetCard>
    )
  }

  if (!plan) {
    return (
      <WidgetCard title={t('components.monthPlan.name')}>
        <Empty
          text={t('templates.widgets.noPlan', { month: monthName })}
          href={href}
          action={t('plan.list.planMonth', { month: monthName })}
        />
      </WidgetCard>
    )
  }

  const lines = plan.lines ?? []
  const totals = planTotals(plan.incomes ?? [], lines)
  const onPlan = lines.filter(
    line => lineStatus(line, totals.income) === 'on'
  ).length

  return (
    <WidgetCard
      title={`${t('components.monthPlan.name')} · ${monthName}`}
      href={href}
    >
      <Breakdown
        currency={plan.currency}
        income={totals.income}
        items={lines.map(line => ({
          label: line.label,
          amount: lineAmount(line, totals.income)
        }))}
      />
      <dl className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm'>
        <dt className='text-muted-foreground'>{t('plan.totals.income')}</dt>
        <dd className='text-right tabular-nums'>
          {formatBalance(totals.income, plan.currency)}
        </dd>
        {totals.checked > 0 && (
          <>
            <dt className='text-muted-foreground'>
              {t('plan.list.actualLeftover')}
            </dt>
            <dd
              className={cn(
                'text-right tabular-nums font-medium',
                totals.actualLeftover < 0 && 'text-destructive'
              )}
            >
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
    </WidgetCard>
  )
}

export function PlanHistoryWidget () {
  const { t } = useTranslation('common')
  const { data: plans = [], isLoading } = usePlans()

  // HistoryChart draws the latest plan's currency and needs two months of it
  const currency = plans[0]?.currency
  const enough = plans.filter(plan => plan.currency === currency).length >= 2

  if (!isLoading && enough) return <HistoryChart plans={plans} />

  return (
    <WidgetCard title={t('plan.history.title')} href='/plan'>
      {isLoading ? (
        <WidgetSkeleton />
      ) : (
        <p className='py-6 text-center text-sm text-muted-foreground'>
          {t('templates.widgets.planHistoryEmpty')}
        </p>
      )}
    </WidgetCard>
  )
}
