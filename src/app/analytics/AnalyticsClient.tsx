'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { MonthSelector } from './MonthSelector'
import { MonthlyExpenseChart } from './MonthlyExpenseChart'
import { useQuery } from '@tanstack/react-query'
import { transactionService } from '@/lib/services/transaction'
import { useWallet } from '@/contexts/wallet-context'

export function AnalyticsClient () {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const { selectedWallet, isAllWalletsSelected, wallets } = useWallet()
  const selectedWalletId = selectedWallet?.id || ''

  // Get wallets sorted by transaction amount for "All wallets" mode
  const { data: sortedWallets = [], isLoading: sortedWalletsLoading } =
    useQuery({
      queryKey: [
        'sorted-wallets',
        isAllWalletsSelected,
        wallets.map(w => w.id)
      ],
      queryFn: async () => {
        console.log('Sorting wallets query running:', {
          isAllWalletsSelected,
          walletsCount: wallets.length
        })

        if (!isAllWalletsSelected) {
          const currentWallet = wallets.find(w => w.id === selectedWalletId)
          console.log('Single wallet mode:', {
            selectedWalletId,
            currentWallet
          })
          return currentWallet ? [currentWallet] : []
        }

        if (wallets.length === 0) {
          console.log('No wallets available')
          return []
        }

        console.log(
          'Calculating amounts for wallets:',
          wallets.map(w => w.name)
        )

        // Calculate total transaction amount for each wallet
        const walletAmounts = await Promise.all(
          wallets.map(async wallet => {
            try {
              const [expenses, income] = await Promise.all([
                transactionService.getCurrentMonthExpensesByCategory(wallet.id),
                transactionService.getCurrentMonthIncomeByCategory(wallet.id)
              ])

              const totalAmount =
                expenses.reduce((sum, item) => sum + item.amount, 0) +
                income.reduce((sum, item) => sum + item.amount, 0)

              console.log(
                `Wallet ${wallet.name}: expenses=${expenses.length}, income=${income.length}, total=${totalAmount}`
              )

              return { wallet, totalAmount }
            } catch (error) {
              console.error(
                `Error calculating amount for wallet ${wallet.id}:`,
                error
              )
              return { wallet, totalAmount: 0 }
            }
          })
        )

        // Sort by total amount (highest first) and filter out wallets with no transactions
        const filteredAndSorted = walletAmounts
          .filter(item => item.totalAmount > 0)
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .map(item => item.wallet)

        console.log(
          'Sorted wallets result:',
          filteredAndSorted.map(w => ({ name: w.name, id: w.id }))
        )

        return filteredAndSorted
      },
      enabled: wallets.length > 0
    })

  // Fetch all transactions for the selected wallet(s) to determine available months
  const { data: allTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['wallet-transactions', selectedWalletId, isAllWalletsSelected],
    queryFn: async () => {
      if (!selectedWalletId) return []

      try {
        // Get all transactions for the wallet(s) (last 2 years)
        const currentDate = new Date()
        const startDate = new Date(currentDate.getFullYear() - 2, 0, 1)

        if (isAllWalletsSelected) {
          // For "All wallets", get transactions from all wallets
          const allTransactions = await transactionService.getAll()

          // Filter transactions for all wallets and date range
          const filteredTransactions = allTransactions.filter(
            t =>
              new Date(t.date) >= startDate &&
              t.type === 'expense' &&
              !t.is_deleted &&
              !t.is_hidden
          )

          return filteredTransactions
        } else {
          // For single wallet, use existing logic
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

          return filteredTransactions
        }
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
    isAllWalletsSelected,
    transactionsLoading,
    sortedWalletsLoading,
    sortedWalletsCount: sortedWallets?.length || 0,
    allTransactionsCount: allTransactions?.length || 0,
    availableMonthsCount: availableMonths?.length || 0,
    selectedMonth,
    walletsCount: wallets.length
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
          {isAllWalletsSelected ? (
            <div className='space-y-6'>
              {sortedWalletsLoading ? (
                <div className='text-center py-8'>Loading wallets...</div>
              ) : sortedWallets.length > 0 ? (
                sortedWallets.map(wallet => (
                  <MonthlyExpenseChart
                    key={wallet.id}
                    month={selectedMonth}
                    walletId={wallet.id}
                    showWalletName={true}
                  />
                ))
              ) : (
                <div className='text-center py-8 text-muted-foreground'>
                  No wallets with transactions found
                </div>
              )}
            </div>
          ) : (
            <MonthlyExpenseChart
              month={selectedMonth}
              walletId={selectedWalletId}
            />
          )}
        </div>
      )}
    </div>
  )
}
