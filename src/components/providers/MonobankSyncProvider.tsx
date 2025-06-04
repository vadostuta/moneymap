'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { MonobankService } from '@/lib/services/monobank'
// import { toastService } from '@/lib/services/toast'
import { subDays } from 'date-fns'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'

export function MonobankSyncProvider ({
  children
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const FETCH_COOLDOWN = 60000 // 1 minute cooldown

  // Query to get the last synced transaction
  const { data: lastTransaction } = useQuery({
    queryKey: ['last-synced-transaction'],
    queryFn: () => MonobankService.getLastSyncedTransaction(),
    enabled: !!user,
    staleTime: FETCH_COOLDOWN // Consider data stale after 1 minute
  })

  // Change useQuery to useMutation for sync operation
  const { mutate: syncTransactions } = useMutation({
    mutationFn: async () => {
      if (!user) return

      const to = new Date()
      let from: Date

      if (!lastTransaction) {
        // If no transactions, fetch last 30 days
        from = subDays(to, 30)
      } else {
        // Start from last transaction, but don't exceed 30 days
        const thirtyDaysAgo = subDays(to, 30)
        from = new Date(lastTransaction.date)
        if (from < thirtyDaysAgo) {
          from = thirtyDaysAgo
        }
      }

      // Only fetch if there's a gap to fill
      if (from < to) {
        await MonobankService.syncTransactionsForDateRange(from, to)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['last-synced-transaction'] })
    }
  })

  useEffect(() => {
    if (!user) {
      queryClient.removeQueries({ queryKey: ['transactions'] })
      queryClient.removeQueries({ queryKey: ['last-synced-transaction'] })
      return
    }

    // Initial sync
    syncTransactions()

    // Set up interval for subsequent syncs
    const interval = setInterval(syncTransactions, FETCH_COOLDOWN)

    return () => clearInterval(interval)
  }, [user, syncTransactions])

  return <>{children}</>
}
