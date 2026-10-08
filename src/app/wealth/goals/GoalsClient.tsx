'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Flag } from 'lucide-react'
import { wealthService } from '@/lib/services/wealth'
import { claimService } from '@/lib/services/claim'
import { usePrivacy } from '@/contexts/privacy-context'
import { Card, CardContent } from '@/components/ui/card'
import { WealthTabs } from '../WealthTabs'
import { formatSnapshotDate } from '../utils'
import { Goal, buildGoals, isGoal } from './goals'
import { GoalStatusBadge } from './GoalStatusBadge'
import { GoalChart } from './GoalChart'

const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0
})

export default function GoalsClient () {
  const { t } = useTranslation('common')

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['wealth-snapshots'],
    queryFn: wealthService.getAll
  })
  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: claimService.getAll
  })

  const goals = buildGoals(claims, snapshots)
  // Claims with a target that aren't goals yet: missing a date or currency
  const almostGoals = claims.filter(
    claim =>
      !claim.is_archived && claim.target_amount !== null && !isGoal(claim)
  ).length

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h1 className='text-lg sm:text-xl md:text-2xl font-bold'>
          {t('wealth.title')}
        </h1>
        <WealthTabs />
      </div>

      {isLoading || claimsLoading ? (
        <div className='space-y-3'>
          {[...Array(2)].map((_, i) => (
            <div key={i} className='h-48 bg-muted animate-pulse rounded-lg' />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center text-center gap-3 py-10'>
            <Flag className='h-10 w-10 text-muted-foreground' />
            <h2 className='text-lg font-semibold'>
              {t('wealth.goals.emptyTitle')}
            </h2>
            <p className='text-sm text-muted-foreground max-w-md'>
              {t('wealth.goals.emptyDescription')}
            </p>
            <Link href='/claims' className='text-sm underline underline-offset-4'>
              {t('wealth.form.manageClaims')}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 lg:grid-cols-2'>
          {goals.map(goal => (
            <GoalCard key={goal.claim.id} goal={goal} />
          ))}
        </div>
      )}

      {almostGoals > 0 && (
        <p className='text-sm text-muted-foreground'>
          {t('wealth.goals.almostGoals', { count: almostGoals })}{' '}
          <Link href='/claims' className='underline underline-offset-4'>
            {t('wealth.form.manageClaims')}
          </Link>
        </p>
      )}
    </div>
  )
}

function GoalCard ({ goal }: { goal: Goal }) {
  const { t, i18n } = useTranslation('common')
  const { formatBalance } = usePrivacy()
  const money = (amount: number) => formatBalance(amount, goal.currency)
  const monthYear = (date: Date) =>
    date.toLocaleDateString(i18n.language === 'ua' ? 'uk-UA' : 'en-US', {
      month: 'short',
      year: 'numeric'
    })

  return (
    <Card>
      <CardContent className='pt-5 space-y-4'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0'>
            <h2 className='font-semibold truncate'>{goal.claim.name}</h2>
            <p className='text-xs text-muted-foreground'>
              {t('wealth.goals.due', {
                date: formatSnapshotDate(goal.targetDate, i18n.language),
                months: Math.max(0, Math.ceil(goal.monthsLeft))
              })}
            </p>
          </div>
          <GoalStatusBadge status={goal.status} />
        </div>

        <div className='space-y-1.5'>
          <div className='flex items-baseline justify-between gap-2 text-sm'>
            <span className='tabular-nums'>
              <span className='font-semibold'>{money(goal.current)}</span>
              <span className='text-muted-foreground'>
                {' '}
                {t('wealth.goals.of', { target: money(goal.target) })}
              </span>
            </span>
            <span className='tabular-nums text-muted-foreground'>
              {percent.format(goal.progress)}
            </span>
          </div>
          <div
            className='h-2 rounded-full bg-muted overflow-hidden'
            role='progressbar'
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.min(1, goal.progress) * 100)}
          >
            <div
              className='h-full rounded-full bg-[hsl(var(--chart-1))]'
              style={{ width: `${Math.min(1, goal.progress) * 100}%` }}
            />
          </div>
        </div>

        <dl className='grid grid-cols-2 gap-3 text-sm'>
          <div>
            <dt className='text-xs text-muted-foreground'>
              {t('wealth.goals.needed')}
            </dt>
            <dd className='tabular-nums font-medium'>
              {goal.neededPace === null || goal.remaining === 0
                ? '—'
                : t('wealth.goals.perMonth', { amount: money(goal.neededPace) })}
            </dd>
          </div>
          <div>
            <dt className='text-xs text-muted-foreground'>
              {t('wealth.goals.pace')}
            </dt>
            <dd className='tabular-nums font-medium'>
              {goal.actualPace === null
                ? '—'
                : t('wealth.goals.perMonth', { amount: money(goal.actualPace) })}
            </dd>
          </div>
        </dl>

        <p className='text-sm text-muted-foreground'>
          {verdict(goal, t, money, monthYear)}
        </p>

        {goal.points.length >= 2 && <GoalChart goal={goal} />}

        {goal.skipped > 0 && (
          <p className='text-xs text-muted-foreground'>
            {t('wealth.goals.skipped', {
              count: goal.skipped,
              currency: goal.currency
            })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function verdict (
  goal: Goal,
  t: (key: string, options?: Record<string, unknown>) => string,
  money: (amount: number) => string,
  monthYear: (date: Date) => string
): string {
  switch (goal.status) {
    case 'reached':
      return goal.current > goal.target
        ? t('wealth.goals.verdict.reachedOver', {
          amount: money(goal.current - goal.target)
        })
        : t('wealth.goals.verdict.reached')
    case 'overdue':
      return t('wealth.goals.verdict.overdue', { amount: money(goal.remaining) })
    case 'notStarted':
      return t('wealth.goals.verdict.notStarted')
    case 'tooEarly':
      return t('wealth.goals.verdict.tooEarly')
    case 'onTrack':
      return goal.projected
        ? t('wealth.goals.verdict.onTrack', { date: monthYear(goal.projected) })
        : t('wealth.goals.verdict.onTrackPlain')
    case 'behind':
      return goal.projected
        ? t('wealth.goals.verdict.behind', {
          date: monthYear(goal.projected),
          gap: money((goal.neededPace ?? 0) - (goal.actualPace ?? 0))
        })
        : t('wealth.goals.verdict.stalled', {
          amount: money(goal.neededPace ?? 0)
        })
  }
}
