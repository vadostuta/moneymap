'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
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

    // First, check if integration exists at all (without joins)
    const { data: basicIntegration } = await supabase
      .from('bank_integrations')
      .select('*') // Just get all fields first
      .eq('user_id', user.id)
      .eq('provider', 'monobank')
      .eq('is_active', true)

    console.log('Basic integration check:', basicIntegration) // Debug log

    // Then try the wallet join
    const { data: integrations, error: integrationError } = await supabase
      .from('bank_integrations')
      .select('wallet_id, wallet:wallets!inner(id)')
      .eq('user_id', user.id)
      .eq('provider', 'monobank')
      .eq('is_active', true)

    console.log('Integrations with wallet:', integrations) // Debug log

    // If no integrations or error, just return silently
    if (integrationError || !integrations || integrations.length === 0) {
      return
    }

    const connectedWallet = integrations[0] // Take the first active integration
    if (!connectedWallet) return

    try {
      const to = new Date()

      // Get last transaction date
      const { data: lastTransaction } = await supabase
        .from('transactions')
        .select('date, wallet:wallets!inner(id)')
        .eq('is_deleted', false)
        .eq('wallets.is_deleted', false)
        .not('monobank_id', 'is', null)
        .order('date', { ascending: false })
        .limit(1)

      console.log('lastTransaction', lastTransaction)
      let from: Date
      if (!lastTransaction || lastTransaction.length === 0) {
        // If no transactions, fetch last 30 days instead of just 24h
        from = subDays(to, 30)
      } else {
        // Start from last transaction, but don't exceed 30 days
        const thirtyDaysAgo = subDays(to, 30)
        from = new Date(lastTransaction[0].date)
        if (from < thirtyDaysAgo) {
          from = thirtyDaysAgo
        }
      }

      console.log('from', from)
      console.log('to', to)

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
            connectedWallet.wallet_id
          )
        }

        setLastFetchTime(Date.now())
        localStorage.setItem('lastMonobankFetch', Date.now().toString())
      }
    } catch (error) {
      console.error('Failed to sync Monobank transactions:', error)

      // Check if error is from Monobank API rate limit
      if (
        error instanceof Error &&
        typeof error === 'object' &&
        'errorDescription' in error &&
        error.errorDescription === 'Too many requests'
      ) {
        // Silently fail for rate limit errors
        return
      }

      // Show toast for other errors
      toastService.error('Failed to sync transactions')
    }
  }

  useEffect(() => {
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
