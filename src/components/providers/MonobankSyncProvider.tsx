'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { MonobankService } from '@/lib/services/monobank'
import { toastService } from '@/lib/services/toast'
import { subDays } from 'date-fns'

export function MonobankSyncProvider ({
  children
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const FETCH_COOLDOWN = 60000 // 1 minute cooldown

  const syncTransactions = async () => {
    if (!user) return
    if (Date.now() - lastFetchTime < FETCH_COOLDOWN) return
    try {
      const to = new Date()
      const lastTransaction = await MonobankService.getLastSyncedTransaction()
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
        setLastFetchTime(Date.now())
        localStorage.setItem('lastMonobankFetch', Date.now().toString())
      }
    } catch (error) {
      console.error('Failed to sync Monobank transactions:', error)
      if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
        // Silently fail for rate limit errors
        return
      }
      console.log('error', error)
      console.log('Failed to sync transactions')
      // toastService.error('Failed to sync transactions')
    }
  }

  useEffect(() => {
    console.log('user', user)
    if (!user) {
      localStorage.removeItem('lastMonobankFetch')
      setLastFetchTime(0)
      return
    }

    // Get last fetch time from storage
    const lastFetch = localStorage.getItem('lastMonobankFetch')
    const now = Date.now()

    // Only sync if enough time has passed since last fetch
    if (!lastFetch || now - parseInt(lastFetch) > FETCH_COOLDOWN) {
      syncTransactions()
    }

    // Start interval for subsequent syncs
    const interval = setInterval(syncTransactions, FETCH_COOLDOWN)

    return () => clearInterval(interval)
  }, [user])

  return <>{children}</>
}
