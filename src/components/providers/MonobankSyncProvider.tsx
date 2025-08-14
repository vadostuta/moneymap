'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { MonobankService } from '@/lib/services/monobank'
// import { toastService } from '@/lib/services/toast'
import { useQueryClient, useMutation } from '@tanstack/react-query'

export function MonobankSyncProvider ({
  children
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const FETCH_COOLDOWN = 60000 // 1 minute cooldown

  // Replace the existing sync logic with:
  const { mutate: syncTransactions } = useMutation({
    mutationFn: async () => {
      if (!user) return
      await MonobankService.syncNewTransactions()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['last-synced-transaction'] })
    },
    retry: false,
    mutationKey: ['sync-transactions']
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
