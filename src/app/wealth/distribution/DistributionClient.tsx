'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Plus } from 'lucide-react'
import { wealthService } from '@/lib/services/wealth'
import { claimService } from '@/lib/services/claim'
import { usePrivacy } from '@/contexts/privacy-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WealthTabs } from '../WealthTabs'
import { formatSnapshotDate } from '../utils'
import { BarSegment, Distribution, buildDistribution } from './distribution'

const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1
})

// Slot colours come from the theme's --chart-1..5. In dark mode slots 2 and 3
// step darker: at the theme's values they sit above the lightness band on the
// near-black surface (checked with the dataviz palette validator).
const SLOT_VARS =
  '[--slot-1:hsl(var(--chart-1))] [--slot-2:hsl(var(--chart-2))] [--slot-3:hsl(var(--chart-3))] [--slot-4:hsl(var(--chart-4))] [--slot-5:hsl(var(--chart-5))] ' +
  'dark:[--slot-2:hsl(160_60%_38%)] dark:[--slot-3:hsl(30_80%_44%)]'

const slotColor = (segment: BarSegment) =>
  segment.slot === null
    ? 'hsl(var(--muted-foreground))'
    : `var(--slot-${segment.slot})`

// Free money is the remainder, not a peer of the claims: outlined and hatched
const FREE_STYLE = {
  backgroundImage:
    'repeating-linear-gradient(135deg, hsl(var(--muted-foreground) / 0.35) 0 2px, transparent 2px 7px)'
}

const OVER_STYLE = {
  backgroundImage:
    'repeating-linear-gradient(45deg, hsl(var(--destructive) / 0.45) 0 2px, transparent 2px 7px)'
}

export default function DistributionClient () {
  const { t, i18n } = useTranslation('common')
  const { formatBalance } = usePrivacy()

  const { data: snapshot, isLoading } = useQuery({
    queryKey: ['wealth-snapshots', 'latest'],
    queryFn: wealthService.getLatest
  })
  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: claimService.getAll
  })

  const header = (
    <div className='flex flex-wrap items-center justify-between gap-2'>
      <h1 className='text-lg sm:text-xl md:text-2xl font-bold'>
        {t('wealth.title')}
      </h1>
      <WealthTabs />
    </div>
  )

  if (isLoading || claimsLoading) {
    return (
      <div className='space-y-4'>
        {header}
        {[...Array(3)].map((_, i) => (
          <div key={i} className='h-16 bg-muted animate-pulse rounded-lg' />
        ))}
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className='space-y-4 sm:space-y-6'>
        {header}
        <Card>
          <CardContent className='flex flex-col items-center text-center gap-3 py-10'>
            <p className='text-sm text-muted-foreground max-w-md'>
              {t('wealth.distribution.noSnapshots')}
            </p>
            <Button asChild>
              <Link href='/wealth/new'>
                <Plus className='h-4 w-4 mr-1' />
                {t('wealth.list.emptyAction')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currency = snapshot.display_currency
  const d = buildDistribution(snapshot)
  const money = (amount: number) => formatBalance(amount, currency)
  const isOver = d.over > 0

  return (
    <div className='space-y-4 sm:space-y-6'>
      {header}

      <p className='text-sm text-muted-foreground'>
        {t('wealth.distribution.basedOn', {
          date: formatSnapshotDate(snapshot.snapshot_date, i18n.language)
        })}
      </p>

      {/* 1 · The headline */}
      <div>
        <p className='text-sm font-medium text-muted-foreground'>
          {t('wealth.totals.free')}
        </p>
        <p className='text-4xl sm:text-5xl font-bold tabular-nums tracking-tight'>
          {money(Math.max(0, d.free))}
        </p>
        <p className='text-sm text-muted-foreground mt-2 max-w-xl'>
          {headlineContext(d, t)}
        </p>
      </div>

      {isOver && (
        <div
          role='status'
          className='flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm'
        >
          <AlertTriangle className='h-5 w-5 shrink-0 text-destructive' />
          <div>
            <p className='font-medium'>
              {t('wealth.distribution.overTitle', { amount: money(d.over) })}
            </p>
            <p className='text-muted-foreground mt-1'>
              {t('wealth.distribution.overHint')}
            </p>
          </div>
        </div>
      )}

      {d.allocations.length === 0 ? (
        <Card>
          <CardContent className='pt-6 text-sm text-muted-foreground'>
            {claims.length === 0 ? (
              <>
                {t('wealth.distribution.noClaims')}{' '}
                <Link href='/claims' className='underline underline-offset-4'>
                  {t('wealth.form.manageClaims')}
                </Link>
              </>
            ) : (
              <>
                {t('wealth.distribution.noAllocations')}{' '}
                <Link
                  href='/wealth/new'
                  className='underline underline-offset-4'
                >
                  {t('wealth.newSnapshot')}
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 2 · The allocation bar */}
          <Card>
            <CardContent className={cn('pt-6 space-y-4', SLOT_VARS)}>
              <AllocationBar d={d} money={money} />
              <Legend d={d} money={money} />
            </CardContent>
          </Card>

          {/* 3 · The table */}
          <div className='border rounded-lg overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/50 text-muted-foreground'>
                <tr>
                  <th className='text-left font-medium p-3'>
                    {t('wealth.distribution.claim')}
                  </th>
                  <th className='text-right font-medium p-3'>
                    {t('wealth.distribution.earmarked')}
                  </th>
                  <th className='text-right font-medium p-3'>
                    {t('wealth.distribution.shareOfLiquid')}
                  </th>
                  <th className='text-right font-medium p-3'>
                    {t('wealth.distribution.target')}
                  </th>
                  <th className='text-right font-medium p-3'>
                    {t('wealth.distribution.progress')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {d.allocations.map(allocation => {
                  const target = allocation.claim?.target_amount ?? null
                  const targetCurrency = allocation.claim?.target_currency
                  const comparable =
                    target !== null && target > 0 && targetCurrency === currency
                  return (
                    <tr key={allocation.id} className='border-t'>
                      <td className='p-3'>{allocation.claim?.name}</td>
                      <td className='p-3 text-right tabular-nums whitespace-nowrap'>
                        {money(allocation.amount)}
                      </td>
                      <td className='p-3 text-right tabular-nums'>
                        {shareOf(allocation.amount, d.liquid)}
                      </td>
                      <td className='p-3 text-right tabular-nums whitespace-nowrap'>
                        {target === null
                          ? '—'
                          : formatBalance(
                            target,
                              targetCurrency ?? undefined
                          )}
                      </td>
                      <td
                        className='p-3 text-right tabular-nums'
                        title={
                          target !== null && !comparable
                            ? t('wealth.distribution.progressOtherCurrency')
                            : undefined
                        }
                      >
                        {comparable
                          ? percent.format(allocation.amount / target)
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
                <tr className='border-t font-medium'>
                  <td className='p-3'>
                    {isOver
                      ? t('wealth.distribution.overRow')
                      : t('wealth.totals.free')}
                  </td>
                  <td
                    className={cn(
                      'p-3 text-right tabular-nums whitespace-nowrap',
                      isOver && 'text-destructive'
                    )}
                  >
                    {money(isOver ? d.over : d.free)}
                  </td>
                  <td className='p-3 text-right tabular-nums'>
                    {shareOf(isOver ? d.over : d.free, d.liquid)}
                  </td>
                  <td className='p-3' />
                  <td className='p-3' />
                </tr>
              </tbody>
              <tfoot>
                <tr className='border-t bg-muted/50 text-xs text-muted-foreground'>
                  <td colSpan={5} className='p-3'>
                    {d.locked !== 0
                      ? t('wealth.distribution.basis', {
                        liquid: money(d.liquid),
                        locked: money(d.locked)
                      })
                      : t('wealth.distribution.basisAllLiquid', {
                        liquid: money(d.liquid)
                      })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )

  function shareOf (amount: number, liquid: number) {
    return liquid > 0 ? percent.format(amount / liquid) : '—'
  }
}

function headlineContext (
  d: Distribution,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  if (d.liquid <= 0) return t('wealth.distribution.noLiquid')
  if (d.over > 0) return t('wealth.distribution.contextOver')
  if (d.allocations.length === 0) return t('wealth.distribution.contextAllFree')
  return t('wealth.distribution.context', {
    percent: percent.format(d.free / d.liquid),
    count: d.allocations.length
  })
}

// One bar across liquid money. When claims exceed it, the bar's full width is
// the claims total and the part past liquid is marked OVER.
function AllocationBar ({
  d,
  money
}: {
  d: Distribution
  money: (amount: number) => string
}) {
  const { t } = useTranslation('common')
  const scale = Math.max(d.liquid, d.earmarked)
  if (scale <= 0) return null

  // Proportional flex-grow keeps widths exact with the 2px gaps in between
  const grow = (amount: number) => ({ flex: `${amount} 1 0%` })
  const liquidAt = (d.liquid / scale) * 100

  return (
    <div className='space-y-1'>
      <div className='relative'>
        <div className='flex h-10 gap-0.5' role='img' aria-label={t('wealth.distribution.barLabel')}>
          {d.segments.map((segment, index) => (
            <div
              key={segment.key}
              title={`${segment.name ?? t('wealth.distribution.other')} · ${money(segment.amount)}`}
              className={cn(
                'h-full min-w-[2px]',
                index === 0 && 'rounded-l',
                index === d.segments.length - 1 && d.free <= 0 && 'rounded-r'
              )}
              style={{
                ...grow(segment.amount),
                backgroundColor: slotColor(segment)
              }}
            />
          ))}
          {d.free > 0 && (
            <div
              title={`${t('wealth.totals.free')} · ${money(d.free)}`}
              className='h-full rounded-r border border-muted-foreground/40'
              style={{ ...grow(d.free), ...FREE_STYLE }}
            />
          )}
        </div>

        {d.over > 0 && (
          <div
            className='absolute inset-y-0 right-0 flex items-center justify-center gap-1 rounded-r border-2 border-destructive text-[11px] font-bold text-destructive bg-background/60'
            style={{ left: `${liquidAt}%`, ...OVER_STYLE }}
          >
            <AlertTriangle className='h-3.5 w-3.5' />
            {t('wealth.distribution.overTag')}
          </div>
        )}
      </div>

      <div className='relative h-4 text-[11px] text-muted-foreground'>
        <span className='absolute left-0'>0</span>
        <span
          className={cn('absolute', liquidAt >= 99 ? 'right-0' : '-translate-x-1/2')}
          style={liquidAt >= 99 ? undefined : { left: `${liquidAt}%` }}
        >
          {t('wealth.distribution.liquidMark', { amount: money(d.liquid) })}
        </span>
      </div>
    </div>
  )
}

function Legend ({
  d,
  money
}: {
  d: Distribution
  money: (amount: number) => string
}) {
  const { t } = useTranslation('common')
  return (
    <ul className='flex flex-wrap gap-x-5 gap-y-2 text-sm'>
      {d.segments.map(segment => (
        <li key={segment.key} className='flex items-center gap-2'>
          <span
            className='h-3 w-3 rounded-sm shrink-0'
            style={{ backgroundColor: slotColor(segment) }}
          />
          <span>{segment.name ?? t('wealth.distribution.other')}</span>
          <span className='tabular-nums text-muted-foreground'>
            {money(segment.amount)}
          </span>
        </li>
      ))}
      {d.free > 0 && (
        <li className='flex items-center gap-2'>
          <span
            className='h-3 w-3 rounded-sm shrink-0 border border-muted-foreground/40'
            style={FREE_STYLE}
          />
          <span>{t('wealth.totals.free')}</span>
          <span className='tabular-nums text-muted-foreground'>
            {money(d.free)}
          </span>
        </li>
      )}
      {d.over > 0 && (
        <li className='flex items-center gap-2 text-destructive'>
          <AlertTriangle className='h-3.5 w-3.5' />
          <span>{t('wealth.distribution.overTag')}</span>
          <span className='tabular-nums'>{money(d.over)}</span>
        </li>
      )}
    </ul>
  )
}
