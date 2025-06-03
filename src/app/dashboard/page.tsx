'use client'

import { useAuth } from '@/contexts/auth-context'
// import { useEffect, useState } from 'react'
// import { transactionService } from '@/lib/services/transaction'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { RevenueCard } from '@/components/ui/RevenueCard'
// import {
//   TransactionItem,
//   TransactionItemProps
// } from '@/components/transaction/TransactionItem'
// import { Transaction } from '@/lib/types/transaction'
// import { QuickTransactionForm } from '@/components/transaction/QuickTransactionForm'
// import { Button } from '@/components/ui/button'
// import { format } from 'date-fns'
import { ExpensePieChart } from '@/components/ui/ExpensePieChart'

export default function DashboardPage () {
  const { user, loading } = useAuth()
  // const [summary, setSummary] = useState({
  //   totalExpenses: 0,
  //   totalIncome: 0
  // })
  // const [selectedDate, setSelectedDate] = useState<string | null>(null)
  // const [dateTransactions, setDateTransactions] = useState<Transaction[]>([])
  // const [loadingTransactions, setLoadingTransactions] = useState(false)
  // const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
  // const [refreshTrigger, setRefreshTrigger] = useState(0)
  // const [isMounted, setIsMounted] = useState(false)

  // useEffect(() => {
  //   setIsMounted(true)
  // }, [])

  // useEffect(() => {
  //   if (user) {
  //     fetchSummaryData()
  //   }
  // }, [user])

  // useEffect(() => {
  //   if (user && selectedDate) {
  //     // fetchTransactionsForDate(selectedDate)
  //   } else {
  //     // setDateTransactions([])
  //   }
  // }, [user, selectedDate, selectedWalletId])

  // async function fetchSummaryData () {
  //   try {
  //     const summary = await transactionService.getSummary()
  //     setSummary(summary)
  //   } catch (error) {
  //     console.error('Failed to fetch summary data:', error)
  //   }
  // }

  // async function fetchTransactionsForDate (date: string) {
  //   try {
  //     setLoadingTransactions(true)
  //     if (!selectedWalletId) return

  //     const startDate = new Date(date)
  //     startDate.setHours(0, 0, 0, 0)
  //     const endDate = new Date(date)
  //     endDate.setHours(23, 59, 59, 999)

  //     const transactions = await transactionService.getByWalletAndDateRange(
  //       selectedWalletId,
  //       startDate,
  //       endDate
  //     )
  //     setDateTransactions(transactions)
  //   } catch (error) {
  //     console.error('Failed to fetch transactions for date:', error)
  //   } finally {
  //     setLoadingTransactions(false)
  //   }
  // }

  // const handleDateSelect = (date: string | null) => {
  //   setSelectedDate(date)
  // }

  // const handleWalletChange = (walletId: string) => {
  //   setSelectedWalletId(walletId)
  //   setSelectedDate(null)
  // }

  // const handleTransactionSuccess = () => {
  //   setRefreshTrigger(prev => prev + 1)
  // }

  // if (!isMounted) {
  //   return null
  // }

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
        <div className='lg:col-span-1'>
          {/* <QuickTransactionForm onSuccess={handleTransactionSuccess} /> */}
          <ExpensePieChart />
        </div>

        <div className='lg:col-span-2'>
          {/* <RevenueCard
            onDateSelect={handleDateSelect}
            selectedWalletId={selectedWalletId}
            onWalletChange={handleWalletChange}
            refreshTrigger={refreshTrigger}
          /> */}
        </div>
      </div>

      {/* {selectedDate && (
        <div className='mt-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle>
                Transactions for{' '}
                {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
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
      )} */}
    </div>
  )
}
