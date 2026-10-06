'use client'

import { useQuery } from '@tanstack/react-query'
import { wealthService } from '@/lib/services/wealth'
import { claimService } from '@/lib/services/claim'
import { SnapshotForm } from '../SnapshotForm'

export default function NewSnapshotClient () {
  const { data: previous, isLoading } = useQuery({
    queryKey: ['wealth-snapshots', 'latest'],
    queryFn: wealthService.getLatest,
    // The form seeds once from this; never seed from a cached, outdated copy
    gcTime: 0
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

  return <SnapshotForm previous={previous ?? null} claims={claims} />
}
