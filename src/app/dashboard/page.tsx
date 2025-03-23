'use client'

import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RevenueCard } from '@/components/ui/RevenueCard'
import {
  TransactionItem,
  TransactionItemProps
} from '@/components/transaction/TransactionItem'
import { Transaction } from '@/lib/types/transaction'
import { QuickTransactionForm } from '@/components/transaction/QuickTransactionForm'
import { Button } from '@/components/ui/button'

export default function DashboardPage () {
  const { user, loading } = useAuth()
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    totalIncome: 0
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dateTransactions, setDateTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (user) {
      fetchSummaryData()
    }
  }, [user])

  useEffect(() => {
    if (user && selectedDate) {
      fetchTransactionsForDate(selectedDate)
    } else {
      setDateTransactions([])
    }
  }, [user, selectedDate, selectedWalletId])

  async function fetchSummaryData () {
    try {
      // Fetch total expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('transactions')
        .select('amount, wallet:wallets!inner(id)')
        .eq('user_id', user?.id)
        .eq('type', 'expense')
        .eq('wallets.is_deleted', false)

      // Fetch total income
      const { data: income, error: incomeError } = await supabase
        .from('transactions')
        .select('amount, wallet:wallets!inner(id)')
        .eq('user_id', user?.id)
        .eq('type', 'income')
        .eq('wallets.is_deleted', false)

      if (expensesError || incomeError) {
        console.error(
          'Error fetching summary data:',
          expensesError || incomeError
        )
        return
      }

      // Calculate totals
      const totalExpenses =
        expenses?.reduce((sum, item) => sum + item.amount, 0) || 0
      const totalIncome =
        income?.reduce((sum, item) => sum + item.amount, 0) || 0

      setSummary({ totalExpenses, totalIncome })
      console.log(summary)
    } catch (error) {
      console.error('Failed to fetch summary data:', error)
    }
  }

  async function fetchTransactionsForDate (date: string) {
    try {
      setLoadingTransactions(true)

      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)

      // Only fetch if we have a selectedWalletId
      if (!selectedWalletId) return

      const query = supabase
        .from('transactions')
        .select('*, wallet:wallets!inner(name, id, currency)')
        .eq('user_id', user?.id)
        .eq('wallet_id', selectedWalletId) // Always filter by wallet
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .eq('wallets.is_deleted', false)
        .order('date', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching transactions for date:', error)
        return
      }

      setDateTransactions(data || [])
    } catch (error) {
      console.error('Failed to fetch transactions for date:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleDateSelect = (date: string | null) => {
    setSelectedDate(date)
  }

  const handleWalletChange = (walletId: string) => {
    setSelectedWalletId(walletId)
    setSelectedDate(null)
  }

  const handleTransactionSuccess = () => {
    // Increment refresh trigger to force re-fetch
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className='flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 sm:p-6 md:p-8'>
        <div className='text-center'>
          <p className='text-lg'>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className='flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 sm:p-6 md:p-8'>
        <div className='text-center'>
          <p className='text-lg'>Please log in to view your dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='container px-4 py-4 sm:py-6 mx-auto max-w-7xl'>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Quick Transaction Form - takes 1/3 of the space on desktop */}
        <div className='lg:col-span-1'>
          <QuickTransactionForm onSuccess={handleTransactionSuccess} />
        </div>

        {/* Revenue Card - takes 2/3 of the space on desktop */}
        <div className='lg:col-span-2'>
          <RevenueCard
            onDateSelect={handleDateSelect}
            selectedWalletId={selectedWalletId}
            onWalletChange={handleWalletChange}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>

      {/* Display transactions for the selected date */}
      {selectedDate && (
        <div className='mt-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle>
                Transactions for{' '}
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </CardTitle>
              <button
                onClick={() => setSelectedDate(null)}
                className='rounded-full p-2 hover:bg-muted transition-colors'
                aria-label='Close transactions'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <line x1='18' y1='6' x2='6' y2='18'></line>
                  <line x1='6' y1='6' x2='18' y2='18'></line>
                </svg>
              </button>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <p>Loading transactions...</p>
              ) : dateTransactions.length > 0 ? (
                <div className='space-y-4'>
                  {dateTransactions.map(transaction => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={
                        transaction as TransactionItemProps['transaction']
                      }
                      showActions={false}
                    />
                  ))}
                </div>
              ) : (
                <p className='text-center text-gray-500 py-8'>
                  No transactions found for this date.
                </p>
              )}
              <div className='mt-6 text-center'>
                <Button
                  variant='outline'
                  onClick={() => {
                    const params = new URLSearchParams()

                    if (selectedDate) {
                      params.append(
                        'date',
                        selectedDate.toString().split('T')[0]
                      )
                    }

                    // Always add the wallet parameter if we have one
                    if (selectedWalletId) {
                      params.append('wallet', selectedWalletId)
                    }

                    const query = params.toString()
                      ? `?${params.toString()}`
                      : ''
                    window.location.href = `/transactions${query}`
                  }}
                >
                  View All Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
