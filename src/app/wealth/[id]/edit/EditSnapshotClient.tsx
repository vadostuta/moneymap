'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { wealthService } from '@/lib/services/wealth'
import { claimService } from '@/lib/services/claim'
import { SnapshotForm } from '../../SnapshotForm'

export default function EditSnapshotClient ({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
  const { t } = useTranslation('common')

  const { data: snapshot, isLoading } = useQuery({
    queryKey: ['wealth-snapshot', id],
    queryFn: () => wealthService.getById(id),
    // The form seeds once; always start from what is saved now
    refetchOnMount: 'always'
  })
  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: claimService.getAll
  })

  if (isLoading || claimsLoading) {
    return (
      <div className='space-y-3'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='h-12 bg-muted animate-pulse rounded-lg' />
        ))}
      </div>
    )
  }

  if (!snapshot) {
    return (
      <p className='text-muted-foreground'>
        {t('wealth.errors.notFound')}{' '}
        <Link href='/wealth' className='underline underline-offset-4'>
          {t('wealth.detail.back')}
        </Link>
      </p>
    )
  }

  return <SnapshotForm previous={null} claims={claims} editing={snapshot} />
}
