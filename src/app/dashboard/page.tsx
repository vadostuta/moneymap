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

export default function DashboardPage () {
  const { user, loading } = useAuth()
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    totalIncome: 0
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dateTransactions, setDateTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)

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
  }, [user, selectedDate])

  async function fetchSummaryData () {
    try {
      // Fetch total expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user?.id)
        .eq('type', 'expense')

      // Fetch total income
      const { data: income, error: incomeError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user?.id)
        .eq('type', 'income')

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

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: false })

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
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='w-full'>
          <QuickTransactionForm />
        </div>
        <div className='w-full'>
          {/* <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6'>
          <Card className='w-full'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base sm:text-lg'>
                Total expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-lg sm:text-xl font-bold text-white'>
                - ${summary.totalExpenses.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className='w-full'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base sm:text-lg'>Total income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-lg sm:text-xl font-bold text-green-500'>
                + ${summary.totalIncome.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className='w-full'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base sm:text-lg'>Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-lg sm:text-xl font-bold ${
                  summary.totalIncome - summary.totalExpenses >= 0
                    ? 'text-green-500'
                    : 'text-white'
                }`}
              >
                ${(summary.totalIncome - summary.totalExpenses).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div> */}

          <div className='mb-4 sm:mb-6'>
            <RevenueCard onDateSelect={handleDateSelect} />
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
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
