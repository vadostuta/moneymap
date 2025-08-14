'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { MonthSelector } from './MonthSelector'
import { MonthlyExpenseChart } from './MonthlyExpenseChart'
import { useQuery } from '@tanstack/react-query'
import { transactionService } from '@/lib/services/transaction'
import { useWallet } from '@/contexts/wallet-context'

export function AnalyticsClient () {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const { selectedWallet } = useWallet()
  const selectedWalletId = selectedWallet?.id || ''

  // Fetch all transactions for the selected wallet to determine available months
  const { data: allTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['wallet-transactions', selectedWalletId],
    queryFn: async () => {
      if (!selectedWalletId) return []

      try {
        // Get all transactions for the wallet (last 2 years)
        const currentDate = new Date()
        const startDate = new Date(currentDate.getFullYear() - 2, 0, 1)

        // Use the existing getAll method and filter by wallet
        const allTransactions = await transactionService.getAll()

        // Filter transactions for the selected wallet and date range
        const filteredTransactions = allTransactions.filter(
          t =>
            t.wallet_id === selectedWalletId &&
            new Date(t.date) >= startDate &&
            t.type === 'expense' &&
            !t.is_deleted &&
            !t.is_hidden
        )

        console.log('Filtered transactions:', filteredTransactions)
        console.log('Selected wallet ID:', selectedWalletId)
        console.log('Start date:', startDate)

        return filteredTransactions
      } catch (error) {
        console.error('Error fetching transactions:', error)
        return []
      }
    },
    enabled: !!selectedWalletId
  })

  // Memoize available months calculation
  const availableMonths = useMemo(() => {
    if (!allTransactions || allTransactions.length === 0) {
      console.log('No transactions found for available months calculation')
      return []
    }

    console.log('Processing transactions for months:', allTransactions.length)

    // Group transactions by month and check which months have expenses
    const monthMap = new Map<string, Date>()

    allTransactions.forEach(transaction => {
      if (transaction.type === 'expense' && transaction.amount > 0) {
        const date = new Date(transaction.date)
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`

        if (!monthMap.has(monthKey)) {
          monthMap.set(
            monthKey,
            new Date(date.getFullYear(), date.getMonth(), 1)
          )
        }
      }
    })

    const months = Array.from(monthMap.values()).sort(
      (a, b) => b.getTime() - a.getTime()
    )

    console.log('Available months found:', months.length, months)
    return months
  }, [allTransactions])

  // Update selected month when available months change
  useEffect(() => {
    if (
      availableMonths.length > 0 &&
      !availableMonths.some(
        month =>
          month.getMonth() === selectedMonth.getMonth() &&
          month.getFullYear() === selectedMonth.getFullYear()
      )
    ) {
      // If current selected month is not in available months, select the first available
      setSelectedMonth(availableMonths[0])
    }
  }, [availableMonths, selectedMonth])

  const handleMonthSelect = (month: Date) => {
    setSelectedMonth(month)
  }

  // Debug info
  console.log('Debug info:', {
    selectedWalletId,
    transactionsLoading,
    allTransactionsCount: allTransactions?.length || 0,
    availableMonthsCount: availableMonths?.length || 0,
    selectedMonth
  })

  return (
    <div className='w-full max-w-none space-y-6 px-6'>
      {/* Controls Section */}
      <div className='space-y-6'>
        {/* Month Selection Row */}
        {selectedWalletId && (
          <div className='w-full'>
            <MonthSelector
              selectedMonth={selectedMonth}
              onMonthSelect={handleMonthSelect}
              availableMonths={availableMonths}
            />
          </div>
        )}
      </div>

      {/* Charts Section */}
      {selectedWalletId && selectedMonth && (
        <div className='space-y-6'>
          <MonthlyExpenseChart
            month={selectedMonth}
            walletId={selectedWalletId}
          />
        </div>
      )}
    </div>
  )
}
