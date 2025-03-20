'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { MonobankService } from '@/lib/services/monobank'
import { toast } from 'react-hot-toast'
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

    // Check for active Monobank integration
    const { data: integration } = await supabase
      .from('bank_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'monobank')
      .eq('is_active', true)
      .single()

    if (!integration) return

    // Check for primary wallet
    const { data: primaryWallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single()

    if (!primaryWallet) return

    try {
      const to = new Date()

      // Get last transaction date
      const { data: lastTransaction } = await supabase
        .from('transactions')
        .select('date')
        .order('date', { ascending: false })
        .limit(1)

      let from: Date
      if (!lastTransaction || lastTransaction.length === 0) {
        // If no transactions, fetch last 24h
        from = subDays(to, 1)
      } else {
        // Start from last transaction, but don't exceed 30 days
        const thirtyDaysAgo = subDays(to, 30)
        from = new Date(lastTransaction[0].date)
        if (from < thirtyDaysAgo) {
          from = thirtyDaysAgo
        }
      }

      // Only fetch if there's a gap to fill
      if (from < to) {
        const response = await MonobankService.fetchTransactions(from, to)

        // Get deleted transaction IDs
        const { data: deletedTransactions } = await supabase
          .from('transactions')
          .select('monobank_id')
          .eq('is_deleted', true)
          .not('monobank_id', 'is', null)

        const deletedIds = new Set(
          deletedTransactions?.map(t => t.monobank_id) || []
        )

        // Filter transactions
        const filteredTransactions = response.transactions.filter(
          t => !t.description.includes('На charity') && !deletedIds.has(t.id)
        )

        if (filteredTransactions.length > 0) {
          await MonobankService.saveTransactions(
            filteredTransactions,
            primaryWallet.id
          )
        }

        setLastFetchTime(Date.now())
        localStorage.setItem('lastMonobankFetch', Date.now().toString())
      }
    } catch (error) {
      console.error('Failed to sync Monobank transactions:', error)
      toast.error('Failed to sync transactions')
    }
  }

  useEffect(() => {
    const lastFetch = localStorage.getItem('lastMonobankFetch')
    const now = Date.now()

    if (!lastFetch || now - parseInt(lastFetch) > FETCH_COOLDOWN) {
      syncTransactions()
    }

    // Set up interval for periodic syncing
    const interval = setInterval(syncTransactions, FETCH_COOLDOWN)
    return () => clearInterval(interval)
  }, [user])

  return <>{children}</>
}
