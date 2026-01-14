'use client'

import { useEffect, useRef } from 'react'
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
  const FETCH_COOLDOWN = 120000 // 2 minutes cooldown
  const syncInitiatedRef = useRef(false)

  // Replace the existing sync logic with:
  const { mutate: syncTransactions, isPending } = useMutation({
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
      syncInitiatedRef.current = false
      return
    }

    // Prevent duplicate initial sync if already initiated
    if (syncInitiatedRef.current) return

    syncInitiatedRef.current = true

    // Initial sync - only if not already pending
    if (!isPending) {
      syncTransactions()
    }

    // Set up interval for subsequent syncs
    const interval = setInterval(() => {
      if (!isPending) {
        syncTransactions()
      }
    }, FETCH_COOLDOWN)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return <>{children}</>
}
