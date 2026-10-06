'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, PiggyBank } from 'lucide-react'
import { cn } from '@/lib/utils'
import { wealthService } from '@/lib/services/wealth'
import { toastService } from '@/lib/services/toast'
import { usePrivacy } from '@/contexts/privacy-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { formatShortDate, formatSnapshotDate } from './utils'
import { buildHistory } from './history'
import { NetWorthChart } from './NetWorthChart'
import { WealthTabs } from './WealthTabs'

const changeClass = (value: number | null) =>
  value === null || value === 0
    ? 'text-muted-foreground'
    : value > 0
      ? 'text-green-600 dark:text-green-500'
      : 'text-red-600 dark:text-red-500'

const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1
})

export default function WealthClient () {
  const { t, i18n } = useTranslation('common')
  const { formatBalance } = usePrivacy()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['wealth-snapshots'],
    queryFn: wealthService.getAll
  })

  const history = buildHistory(snapshots)
  const { latest, previous, currency } = history

  // Signed money: '+€120.00' / '-€80.00', still hidden in privacy mode
  const formatChange = (value: number | null, inCurrency = currency) => {
    if (value === null || !inCurrency) return '—'
    const formatted = formatBalance(value, inCurrency)
    return value > 0 && formatted !== '***' ? `+${formatted}` : formatted
  }

  const deleteMutation = useMutation({
    mutationFn: wealthService.softDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wealth-snapshots'] })
      toastService.success(t('wealth.success.deleted'))
    },
    onError: () => {
      toastService.error(t('wealth.errors.deleteFailed'))
    },
    onSettled: () => setPendingDeleteId(null)
  })

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h1 className='text-lg sm:text-xl md:text-2xl font-bold'>
          {t('wealth.title')}
        </h1>
        <WealthTabs />
      </div>

      <div className='flex justify-end empty:hidden'>
        {snapshots.length > 0 && (
          <Button asChild>
            <Link href='/wealth/new'>
              <Plus className='h-4 w-4 mr-1' />
              {t('wealth.newSnapshot')}
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className='space-y-3'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='h-12 bg-muted animate-pulse rounded-lg' />
          ))}
        </div>
      ) : snapshots.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center text-center gap-3 py-10'>
            <PiggyBank className='h-10 w-10 text-muted-foreground' />
            <h2 className='text-lg font-semibold'>
              {t('wealth.list.emptyTitle')}
            </h2>
            <p className='text-sm text-muted-foreground max-w-md'>
              {t('wealth.list.emptyDescription')}
            </p>
            <Button asChild>
              <Link href='/wealth/new'>
                <Plus className='h-4 w-4 mr-1' />
                {t('wealth.list.emptyAction')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {latest && currency && (
            <div className='grid gap-3 grid-cols-2 lg:grid-cols-5'>
              <StatTile
                label={t('wealth.totals.netWorth')}
                value={formatBalance(latest.net_worth, currency)}
                sub={
                  previous && previous.net_worth !== 0 ? (
                    <span className={changeClass(latest.net_worth - previous.net_worth)}>
                      {latest.net_worth >= previous.net_worth ? '▲' : '▼'}{' '}
                      {t('wealth.history.vsPrevious', {
                        percent: percent.format(
                          Math.abs(
                            (latest.net_worth - previous.net_worth) /
                              Math.abs(previous.net_worth)
                          )
                        ),
                        date: formatShortDate(previous.snapshot_date, i18n.language)
                      })}
                    </span>
                  ) : (
                    t('wealth.history.firstSnapshot')
                  )
                }
              />
              <StatTile
                label={t('wealth.totals.liquid')}
                value={formatBalance(latest.liquid, currency)}
                sub={
                  latest.net_worth > 0
                    ? t('wealth.history.shareOfNetWorth', {
                        percent: percent.format(latest.liquid / latest.net_worth)
                      })
                    : t('wealth.totals.liquidHint')
                }
              />
              <StatTile
                label={t('wealth.totals.free')}
                value={formatBalance(latest.free, currency)}
                valueClassName={latest.free < 0 ? 'text-destructive' : undefined}
                sub={
                  latest.earmarked > 0
                    ? t('wealth.history.freeHint', {
                        amount: formatBalance(latest.earmarked, currency)
                      })
                    : t('wealth.history.freeNoClaims')
                }
              />
              <StatTile
                label={t('wealth.history.locked')}
                value={formatBalance(latest.net_worth - latest.liquid, currency)}
                sub={t('wealth.history.lockedHint')}
              />
              <StatTile
                label={t('wealth.history.pace')}
                value={
                  history.pacePerMonth === null
                    ? '—'
                    : formatChange(history.pacePerMonth)
                }
                sub={
                  history.pacePerMonth === null
                    ? t('wealth.history.paceNeedsTwo')
                    : t('wealth.history.paceHint')
                }
              />
            </div>
          )}

          <Card>
            <CardContent className='pt-6 space-y-2'>
              <h2 className='text-base font-semibold'>
                {t('wealth.history.trendTitle', { currency })}
              </h2>
              {history.series.length >= 2 && currency ? (
                <NetWorthChart series={history.series} currency={currency} />
              ) : (
                <p className='text-sm text-muted-foreground py-8 text-center'>
                  {t('wealth.history.chartEmpty')}
                </p>
              )}
              {history.excluded.count > 0 && (
                <p className='text-xs text-muted-foreground'>
                  {t('wealth.history.excluded', {
                    count: history.excluded.count,
                    currencies: history.excluded.currencies.join(', ')
                  })}
                </p>
              )}
            </CardContent>
          </Card>

          <div className='border rounded-lg overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/50 text-muted-foreground'>
                <tr>
                  <th className='text-left font-medium p-3'>
                    {t('wealth.list.date')}
                  </th>
                  <th className='text-right font-medium p-3'>
                    {t('wealth.totals.netWorth')}
                  </th>
                  <th className='text-right font-medium p-3'>
                    {t('wealth.history.change')}
                  </th>
                  <th className='text-right font-medium p-3'>
                    {t('wealth.totals.liquid')}
                  </th>
                  <th className='text-right font-medium p-3'>
                    {t('wealth.totals.free')}
                  </th>
                  <th className='p-3 w-12'>
                    <span className='sr-only'>{t('common.delete')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.rows.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/wealth/${row.id}`)}
                    className='border-t cursor-pointer hover:bg-accent/50 transition-colors'
                  >
                    <td className='p-3 whitespace-nowrap'>
                      {formatSnapshotDate(row.snapshot_date, i18n.language)}
                      {row.display_currency !== currency && (
                        <span className='ml-1 text-xs text-muted-foreground'>
                          · {row.display_currency}
                        </span>
                      )}
                    </td>
                    <td className='p-3 text-right tabular-nums whitespace-nowrap'>
                      {formatBalance(row.net_worth, row.display_currency)}
                    </td>
                    <td
                      className={cn(
                        'p-3 text-right tabular-nums whitespace-nowrap',
                        changeClass(row.delta)
                      )}
                    >
                      {formatChange(row.delta, row.display_currency)}
                    </td>
                    <td className='p-3 text-right tabular-nums whitespace-nowrap'>
                      {formatBalance(row.liquid, row.display_currency)}
                    </td>
                    <td
                      className={cn(
                        'p-3 text-right tabular-nums whitespace-nowrap',
                        row.free < 0 && 'text-destructive'
                      )}
                    >
                      {formatBalance(row.free, row.display_currency)}
                    </td>
                    <td className='p-3'>
                      <Button
                        variant='ghost'
                        size='icon'
                        aria-label={t('common.delete')}
                        onClick={e => {
                          e.stopPropagation()
                          setPendingDeleteId(row.id)
                        }}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={open => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('wealth.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('wealth.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() =>
                pendingDeleteId && deleteMutation.mutate(pendingDeleteId)
              }
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatTile ({
  label,
  value,
  valueClassName,
  sub
}: {
  label: string
  value: string
  valueClassName?: string
  sub: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className='pt-4 sm:pt-6'>
        <p className='text-xs sm:text-sm text-muted-foreground'>{label}</p>
        <p
          className={cn(
            'text-lg sm:text-2xl font-bold tabular-nums mt-1',
            valueClassName
          )}
        >
          {value}
        </p>
        <p className='text-xs text-muted-foreground mt-1'>{sub}</p>
      </CardContent>
    </Card>
  )
}
