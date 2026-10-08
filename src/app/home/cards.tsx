'use client'

// The three headline cards, shared by Home and Dashboard

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getDaysInMonth } from 'date-fns'
import {
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  TrendingUp
} from 'lucide-react'
import { planService } from '@/lib/services/plan'
import { wealthService } from '@/lib/services/wealth'
import { transactionService } from '@/lib/services/transaction'
import { fxService } from '@/lib/services/fx'
import { usePrivacy } from '@/contexts/privacy-context'
import { CurrencyType } from '@/lib/types/wallet'
import { DEFAULT_PLAN_CURRENCY, MonthlyPlan } from '@/lib/types/plan'
import { WealthSnapshotSummary } from '@/lib/types/wealth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { currentMonth, monthToParam, planTotals } from '../plan/plan'
import { formatSnapshotDate } from '../wealth/utils'
import {
  STALE_SNAPSHOT_DAYS,
  netWorthChange,
  snapshotAge,
  spendPace
} from './home'

const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0
})

// This month's expenses converted to `currency` at today's rate, in total and
// per day of the month. Currencies with no stored rate are left out and
// named, rather than guessed.
async function spentThisMonth (currency: CurrencyType) {
  const expenses = await transactionService.getCurrentMonthExpenses()
  const today = new Date()

  const rates = new Map<string, number | null>()
  for (const from of new Set(expenses.map(expense => expense.currency))) {
    const rate = await fxService.getRate(today, from as CurrencyType, currency)
    rates.set(from, rate?.rate ?? null)
  }

  let total = 0
  const byDay: number[] = Array(getDaysInMonth(today)).fill(0)
  for (const expense of expenses) {
    const rate = rates.get(expense.currency)
    if (rate == null) continue
    const amount = expense.amount * rate
    total += amount
    byDay[new Date(expense.date).getDate() - 1] += amount
  }
  const missing = [...rates].filter(([, rate]) => rate === null).map(([c]) => c)
  return { total, missing, byDay }
}

// This month's plan, the currency spending is shown in, and what was spent
export function useMonthSpending () {
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: planService.getAll
  })

  const month = currentMonth()
  const plan = plans.find(item => item.month === month) ?? null
  // Without a plan this month, spending is still shown in the latest plan's
  // currency so it reads the same way once one exists
  const currency = plan?.currency ?? plans[0]?.currency ?? DEFAULT_PLAN_CURRENCY
  const planned = plan
    ? planTotals(plan.incomes ?? [], plan.lines ?? []).spend
    : 0

  const { data: spent, isLoading: spentLoading } = useQuery({
    queryKey: ['home', 'spent', month, currency],
    queryFn: () => spentThisMonth(currency),
    enabled: !plansLoading
  })

  return {
    plan,
    // Planned spending, or null when there is no plan with spend lines
    planned: planned > 0 ? planned : null,
    currency,
    spent,
    isLoading: plansLoading || spentLoading
  }
}

export function HomeCards () {
  const { plan, currency, spent, isLoading } = useMonthSpending()
  const { data: snapshots = [], isLoading: snapshotsLoading } = useQuery({
    queryKey: ['wealth-snapshots'],
    queryFn: wealthService.getAll
  })

  if (snapshotsLoading) {
    return (
      <div className='grid gap-3 md:grid-cols-3'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='h-48 bg-muted animate-pulse rounded-lg' />
        ))}
      </div>
    )
  }

  return (
    <div className='grid gap-3 md:grid-cols-3'>
      <SpentCard
        plan={plan}
        currency={currency}
        spent={spent?.total ?? 0}
        missing={spent?.missing ?? []}
        loading={isLoading}
      />
      <NetWorthCard snapshots={snapshots} />
      <FreeCard snapshot={snapshots[0] ?? null} />
    </div>
  )
}

// ─── Cards ──────────────────────────────────────────────────────────────────

function StatCard ({
  title,
  href,
  children
}: {
  title: string
  href: string
  children: React.ReactNode
}) {
  return (
    <Card className='flex flex-col'>
      <CardContent className='pt-5 flex flex-col gap-3 flex-1'>
        <div className='flex items-center justify-between gap-2'>
          <h2 className='text-sm font-medium text-muted-foreground'>{title}</h2>
          <Link
            href={href}
            className='text-muted-foreground hover:text-foreground'
            aria-label={title}
          >
            <ArrowRight className='h-4 w-4' />
          </Link>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function Empty ({
  text,
  action,
  href
}: {
  text: string
  action: string
  href: string
}) {
  return (
    <div className='flex flex-col items-start gap-3 flex-1 justify-between'>
      <p className='text-sm text-muted-foreground'>{text}</p>
      <Button asChild size='sm' variant='outline'>
        <Link href={href}>{action}</Link>
      </Button>
    </div>
  )
}

const BIG = 'text-2xl sm:text-3xl font-bold tabular-nums tracking-tight break-words'

function SpentCard ({
  plan,
  currency,
  spent,
  missing,
  loading
}: {
  plan: MonthlyPlan | null
  currency: CurrencyType
  spent: number
  missing: string[]
  loading: boolean
}) {
  const { t } = useTranslation('common')
  const { formatBalance } = usePrivacy()
  const money = (amount: number) => formatBalance(amount, currency)
  const title = t('home.spent.title')
  const href = plan ? `/plan/${monthToParam(plan.month)}` : '/plan'

  if (loading) {
    return (
      <StatCard title={title} href={href}>
        <div className='h-24 bg-muted animate-pulse rounded' />
      </StatCard>
    )
  }

  const planned = plan
    ? planTotals(plan.incomes ?? [], plan.lines ?? []).spend
    : 0

  if (!plan || planned <= 0) {
    return (
      <StatCard title={title} href={href}>
        <p className={BIG}>{money(spent)}</p>
        <Empty
          text={t('home.spent.noPlan')}
          action={t('home.spent.planAction')}
          href={`/plan/${monthToParam(currentMonth())}`}
        />
      </StatCard>
    )
  }

  const pace = spendPace(planned, spent)
  const over = spent > planned
  const fill = Math.min(1, spent / planned)
  // Within 5% of the plan's even pace reads as on track
  const onTrack = Math.abs(pace.ahead) <= planned * 0.05
  const PaceIcon = pace.ahead > 0 ? TrendingUp : TrendingDown

  return (
    <StatCard title={title} href={href}>
      <div>
        <p className={BIG}>{money(spent)}</p>
        <p className='text-sm text-muted-foreground'>
          {t('home.spent.ofPlanned', { amount: money(planned) })}
        </p>
      </div>

      <div className='space-y-1'>
        <div
          className='relative h-2.5 rounded-full bg-muted'
          role='img'
          aria-label={t('home.spent.barLabel', {
            percent: percent.format(spent / planned)
          })}
        >
          <div
            className={cn(
              'h-full rounded-full',
              over ? 'bg-destructive' : 'bg-primary'
            )}
            style={{ width: `${fill * 100}%` }}
          />
          {/* Where even spending would be today */}
          <div
            className='absolute -top-1 -bottom-1 w-0.5 bg-foreground/70'
            style={{ left: `${pace.elapsed * 100}%` }}
            title={t('home.spent.paceMark', { amount: money(pace.expected) })}
          />
        </div>
        <p className='text-[11px] text-muted-foreground'>
          {t('home.spent.paceMark', { amount: money(pace.expected) })}
        </p>
      </div>

      <p
        className={cn(
          'mt-auto flex items-center gap-1.5 text-sm font-medium',
          onTrack
            ? 'text-green-700 dark:text-green-400'
            : pace.ahead > 0
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-green-700 dark:text-green-400'
        )}
      >
        {onTrack ? (
          <CheckCircle2 className='h-4 w-4' />
        ) : (
          <PaceIcon className='h-4 w-4' />
        )}
        {over
          ? t('home.spent.over', { amount: money(spent - planned) })
          : onTrack
            ? t('home.spent.onTrack')
            : pace.ahead > 0
              ? t('home.spent.ahead', { amount: money(pace.ahead) })
              : t('home.spent.behind', { amount: money(-pace.ahead) })}
      </p>

      <p className='text-xs text-muted-foreground'>
        {t('home.spent.source')}
        {missing.length > 0 &&
          ' ' + t('home.spent.missing', { currencies: missing.join(', ') })}
      </p>
    </StatCard>
  )
}

function NetWorthCard ({ snapshots }: { snapshots: WealthSnapshotSummary[] }) {
  const { t, i18n } = useTranslation('common')
  const { formatBalance } = usePrivacy()
  const title = t('wealth.totals.netWorth')
  const latest = snapshots[0]

  if (!latest) {
    return (
      <StatCard title={title} href='/wealth'>
        <Empty
          text={t('home.netWorth.empty')}
          action={t('wealth.list.emptyAction')}
          href='/wealth/new'
        />
      </StatCard>
    )
  }

  const money = (amount: number) => formatBalance(amount, latest.display_currency)
  const change = netWorthChange(snapshots)
  const age = snapshotAge(latest.snapshot_date)

  return (
    <StatCard title={title} href='/wealth'>
      <p className={BIG}>{money(latest.net_worth)}</p>

      {change && (
        <p
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium',
            change.amount >= 0
              ? 'text-green-700 dark:text-green-400'
              : 'text-destructive'
          )}
        >
          {change.amount >= 0 ? (
            <TrendingUp className='h-4 w-4' />
          ) : (
            <TrendingDown className='h-4 w-4' />
          )}
          {(change.amount >= 0 ? '+' : '−') + money(Math.abs(change.amount))}
          <span className='font-normal text-muted-foreground'>
            {t('home.netWorth.since', {
              date: formatSnapshotDate(change.since, i18n.language)
            })}
          </span>
        </p>
      )}

      <dl className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm'>
        <dt className='text-muted-foreground'>{t('wealth.totals.liquid')}</dt>
        <dd className='text-right tabular-nums'>{money(latest.liquid)}</dd>
        <dt className='text-muted-foreground'>{t('home.netWorth.locked')}</dt>
        <dd className='text-right tabular-nums'>
          {money(latest.net_worth - latest.liquid)}
        </dd>
      </dl>

      <p
        className={cn(
          'mt-auto text-xs',
          age > STALE_SNAPSHOT_DAYS
            ? 'text-amber-700 dark:text-amber-400'
            : 'text-muted-foreground'
        )}
      >
        {t('home.asOf', {
          date: formatSnapshotDate(latest.snapshot_date, i18n.language)
        })}
      </p>
    </StatCard>
  )
}

function FreeCard ({ snapshot }: { snapshot: WealthSnapshotSummary | null }) {
  const { t, i18n } = useTranslation('common')
  const { formatBalance } = usePrivacy()
  const title = t('wealth.totals.free')

  if (!snapshot) {
    return (
      <StatCard title={title} href='/wealth/distribution'>
        <Empty
          text={t('home.free.empty')}
          action={t('wealth.list.emptyAction')}
          href='/wealth/new'
        />
      </StatCard>
    )
  }

  const money = (amount: number) =>
    formatBalance(amount, snapshot.display_currency)
  const { liquid, earmarked, free } = snapshot
  const over = free < 0
  const scale = Math.max(liquid, earmarked)

  return (
    <StatCard title={title} href='/wealth/distribution'>
      <p className={cn(BIG, over && 'text-destructive')}>
        {money(Math.max(0, free))}
      </p>

      {scale > 0 && (
        <div className='space-y-1'>
          <div
            className='flex h-2.5 gap-0.5 rounded-full overflow-hidden bg-muted'
            role='img'
            aria-label={t('home.free.barLabel', {
              claimed: money(earmarked),
              free: money(Math.max(0, free))
            })}
          >
            {earmarked > 0 && (
              <div
                className='h-full bg-[hsl(var(--chart-1))]'
                style={{ flex: `${Math.min(earmarked, liquid)} 1 0%` }}
              />
            )}
            {free > 0 && (
              <div
                className='h-full bg-muted-foreground/30'
                style={{ flex: `${free} 1 0%` }}
              />
            )}
            {over && (
              <div
                className='h-full bg-destructive'
                style={{ flex: `${-free} 1 0%` }}
              />
            )}
          </div>
        </div>
      )}

      <dl className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm'>
        <dt className='flex items-center gap-2 text-muted-foreground'>
          <span className='h-2.5 w-2.5 rounded-sm bg-[hsl(var(--chart-1))]' />
          {t('wealth.totals.claimed')}
        </dt>
        <dd className='text-right tabular-nums'>{money(earmarked)}</dd>
        <dt className='flex items-center gap-2 text-muted-foreground'>
          <span className='h-2.5 w-2.5 rounded-sm bg-muted-foreground/30' />
          {t('wealth.totals.liquid')}
        </dt>
        <dd className='text-right tabular-nums'>{money(liquid)}</dd>
      </dl>

      <p className='mt-auto text-xs text-muted-foreground'>
        {over
          ? t('home.free.over', { amount: money(-free) })
          : liquid > 0
            ? t('home.free.share', { percent: percent.format(free / liquid) })
            : t('wealth.distribution.noLiquid')}
        {' · '}
        {t('home.asOf', {
          date: formatSnapshotDate(snapshot.snapshot_date, i18n.language)
        })}
      </p>
    </StatCard>
  )
}
