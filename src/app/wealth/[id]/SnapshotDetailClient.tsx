'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { wealthService } from '@/lib/services/wealth'
import { toastService } from '@/lib/services/toast'
import { usePrivacy } from '@/contexts/privacy-context'
import { computeTotals, sumAllocations } from '@/lib/types/wealth'
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
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { formatRate, formatSnapshotDate } from '../utils'

export default function SnapshotDetailClient ({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
  const { t, i18n } = useTranslation('common')
  const { formatBalance } = usePrivacy()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: snapshot, isLoading, isError } = useQuery({
    queryKey: ['wealth-snapshot', id],
    queryFn: () => wealthService.getById(id)
  })

  const deleteMutation = useMutation({
    mutationFn: () => wealthService.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wealth-snapshots'] })
      queryClient.removeQueries({ queryKey: ['wealth-snapshot', id] })
      toastService.success(t('wealth.success.deleted'))
      router.push('/wealth')
    },
    onError: () => {
      toastService.error(t('wealth.errors.deleteFailed'))
      setConfirmOpen(false)
    }
  })

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='h-12 bg-muted animate-pulse rounded-lg' />
        ))}
      </div>
    )
  }

  if (isError || !snapshot) {
    return (
      <div className='space-y-4'>
        <p className='text-muted-foreground'>{t('wealth.errors.notFound')}</p>
        <Button variant='outline' asChild>
          <Link href='/wealth'>
            <ArrowLeft className='h-4 w-4 mr-1' />
            {t('wealth.detail.back')}
          </Link>
        </Button>
      </div>
    )
  }

  const lines = snapshot.lines ?? []
  const currency = snapshot.display_currency
  const totals = computeTotals(lines)
  const allocations = snapshot.allocations ?? []

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            asChild
            aria-label={t('wealth.detail.back')}
          >
            <Link href='/wealth'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <h1 className='text-lg sm:text-xl md:text-2xl font-bold'>
            {formatSnapshotDate(snapshot.snapshot_date, i18n.language)}
          </h1>
          <span className='text-sm text-muted-foreground'>· {currency}</span>
        </div>

        <div className='flex gap-2'>
          <Button variant='outline' asChild>
            <Link href={`/wealth/${id}/edit`}>
              <Pencil className='h-4 w-4 mr-1' />
              {t('common.edit')}
            </Link>
          </Button>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button variant='outline'>
              <Trash2 className='h-4 w-4 mr-1' />
              {t('common.delete')}
            </Button>
          </AlertDialogTrigger>
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
                onClick={e => {
                  e.preventDefault()
                  deleteMutation.mutate()
                }}
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>

      {snapshot.note && <p className='text-sm'>{snapshot.note}</p>}

      <div className='grid gap-3 sm:grid-cols-2'>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-sm font-medium'>
              {t('wealth.totals.netWorth')}
            </p>
            <p className='text-xs text-muted-foreground'>
              {t('wealth.totals.netWorthHint')}
            </p>
            <p className='text-2xl font-bold tabular-nums mt-2'>
              {formatBalance(totals.netWorth, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-sm font-medium'>{t('wealth.totals.liquid')}</p>
            <p className='text-xs text-muted-foreground'>
              {t('wealth.totals.liquidHint')}
            </p>
            <p className='text-2xl font-bold tabular-nums mt-2'>
              {formatBalance(totals.liquid, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='border rounded-lg overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50 text-muted-foreground'>
            <tr>
              <th className='text-left font-medium p-3'>
                {t('wealth.form.label')}
              </th>
              <th className='text-left font-medium p-3'>
                {t('wealth.form.type')}
              </th>
              <th className='text-right font-medium p-3'>
                {t('wealth.form.amount')}
              </th>
              <th className='text-right font-medium p-3'>
                {t('wealth.form.rate')}
              </th>
              <th className='text-right font-medium p-3'>
                {t('wealth.detail.converted', { currency })}
              </th>
              <th className='text-center font-medium p-3'>
                {t('wealth.form.liquid')}
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map(line => (
              <tr key={line.id} className='border-t'>
                <td className='p-3'>{line.label}</td>
                <td className='p-3 text-muted-foreground'>
                  {t(`wallets.types.${line.type}`)}
                </td>
                <td className='p-3 text-right tabular-nums whitespace-nowrap'>
                  {formatBalance(line.amount, line.currency)}
                </td>
                <td
                  className='p-3 text-right tabular-nums whitespace-nowrap'
                  title={String(line.rate)}
                >
                  {formatRate(line.rate)}
                  {line.rate_source && (
                    <span className='block text-xs text-muted-foreground'>
                      {t(`wealth.sources.${line.rate_source}`)}
                    </span>
                  )}
                </td>
                <td className='p-3 text-right tabular-nums whitespace-nowrap'>
                  {formatBalance(line.converted_amount, currency)}
                </td>
                <td className='p-3 text-center'>
                  {line.is_liquid ? t('wealth.detail.yes') : t('wealth.detail.no')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {allocations.length > 0 && (
        <div className='space-y-2'>
          <h2 className='text-base sm:text-lg font-semibold'>
            {t('wealth.form.claimsSection')}
          </h2>
          <div className='border rounded-lg overflow-x-auto'>
            <table className='w-full text-sm'>
              <tbody>
                {allocations.map(allocation => (
                  <tr key={allocation.id} className='border-t first:border-t-0'>
                    <td className='p-3'>{allocation.claim?.name}</td>
                    <td className='p-3 text-right tabular-nums whitespace-nowrap'>
                      {formatBalance(allocation.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className='border-t bg-muted/50 font-medium'>
                  <td className='p-3'>{t('wealth.totals.claimed')}</td>
                  <td className='p-3 text-right tabular-nums whitespace-nowrap'>
                    {formatBalance(sumAllocations(allocations), currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
