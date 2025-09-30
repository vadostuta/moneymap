'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@/contexts/wallet-context'
import { useTranslation } from 'react-i18next'
import { transactionService } from '@/lib/services/transaction'
import { MonthlySummaryCards } from './components/MonthlySummaryCards'
import { IncomeAnalysisSection } from './components/IncomeAnalysisSection'
import { ExpenseAnalysisSection } from './components/ExpenseAnalysisSection'
import { CategoryPerformanceSection } from './components/CategoryPerformanceSection'
import { TransactionInsightsSection } from './components/TransactionInsightsSection'
import { MonthSelector } from '@/app/analytics/components/MonthSelector'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function ReportClient () {
  const { t } = useTranslation('common')
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const { selectedWallet, isAllWalletsSelected } = useWallet()

  // Get wallet ID
  const selectedWalletId = isAllWalletsSelected ? 'all' : selectedWallet?.id

  // Fetch all transactions for the selected wallet(s) to determine available months
  const { data: allTransactions = [] } = useQuery({
    queryKey: [
      'report-all-transactions',
      selectedWalletId,
      isAllWalletsSelected
    ],
    queryFn: async () => {
      if (!selectedWalletId) return []

      try {
        // Get all transactions for the wallet(s) (last 2 years)
        const currentDate = new Date()
        const startDate = new Date(currentDate.getFullYear() - 2, 0, 1)

        // Get ALL transactions first
        const allTransactions = await transactionService.getAll()

        if (isAllWalletsSelected) {
          // For "All wallets", get transactions from all wallets
          return allTransactions.filter(
            t => new Date(t.date) >= startDate && !t.is_deleted && !t.is_hidden
          )
        } else {
          // For single wallet, filter by wallet
          return allTransactions.filter(
            t =>
              t.wallet_id === selectedWalletId &&
              new Date(t.date) >= startDate &&
              !t.is_deleted &&
              !t.is_hidden
          )
        }
      } catch (error) {
        console.error('Error fetching transactions:', error)
        return []
      }
    },
    enabled: !!selectedWalletId
  })

  // Calculate available months from ALL transactions for the selected wallet
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

  // Use the same service methods as MonthlyExpenseChart for accurate data
  const { data: monthlyExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: [
      'monthly-expenses',
      selectedWalletId,
      selectedMonth.getFullYear(),
      selectedMonth.getMonth()
    ],
    queryFn: () =>
      transactionService.getMonthlyExpensesByCategory(
        selectedWalletId!,
        selectedMonth.getFullYear(),
        selectedMonth.getMonth()
      ),
    enabled: !!selectedWalletId && selectedWalletId !== 'all'
  })

  const { data: monthlyIncome = [], isLoading: incomeLoading } = useQuery({
    queryKey: [
      'monthly-income',
      selectedMonth.getFullYear(),
      selectedMonth.getMonth()
    ],
    queryFn: () =>
      transactionService.getCurrentMonthIncomeByCategory(selectedWalletId),
    enabled: !!selectedWalletId && selectedWalletId !== 'all'
  })

  // Calculate summary metrics using the service data
  const monthlyMetrics = useMemo(() => {
    const income = monthlyIncome.reduce((sum, item) => sum + item.amount, 0)
    const expenses = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0)
    const net = income - expenses
    const savingsRate = income > 0 ? (net / income) * 100 : 0

    console.log('Monthly metrics calculation (using service data):', {
      income,
      expenses,
      net,
      savingsRate,
      expensesData: monthlyExpenses,
      incomeData: monthlyIncome
    })

    return {
      income,
      expenses,
      net,
      savingsRate
    }
  }, [monthlyExpenses, monthlyIncome])

  // Fetch transactions for the selected month and wallet (for detailed analysis)
  const { data: monthTransactions = [] } = useQuery({
    queryKey: [
      'report-month-transactions',
      selectedMonth.getFullYear(),
      selectedMonth.getMonth()
    ],
    queryFn: async () => {
      if (!selectedWalletId) return []

      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth()
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0)

      // Filter transactions for selected wallet and month
      return allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date)
        const isInDateRange =
          transactionDate >= startDate && transactionDate <= endDate
        const isCorrectWallet =
          selectedWalletId === 'all' ||
          transaction.wallet_id === selectedWalletId

        return isInDateRange && isCorrectWallet
      })
    },
    enabled: !!selectedWalletId && !!allTransactions.length
  })

  const currency = selectedWallet?.currency || 'UAH'

  return (
    <div className='container mx-auto px-3 sm:px-4 md:px-6 pb-8 max-w-7xl'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold mb-2'>
          {t('navigation.report', 'Monthly Report')}
        </h1>
        <p className='text-muted-foreground'>
          {t(
            'report.description',
            'Comprehensive overview of your monthly financial activity'
          )}
        </p>
      </div>

      {/* Month Selector */}
      <div className='mb-6'>
        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthSelect={setSelectedMonth}
          availableMonths={availableMonths}
        />
      </div>

      {/* Monthly Summary Cards */}
      <MonthlySummaryCards
        metrics={monthlyMetrics}
        currency={currency}
        isLoading={expensesLoading || incomeLoading}
      />

      {/* Tabbed Sections */}
      <div className='mt-8'>
        <Tabs defaultValue='overview' className='w-full'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='overview'>
              {t('report.tabs.overview', 'Overview')}
            </TabsTrigger>
            <TabsTrigger value='income'>
              {t('report.tabs.income', 'Income')}
            </TabsTrigger>
            <TabsTrigger value='expenses'>
              {t('report.tabs.expenses', 'Expenses')}
            </TabsTrigger>
            <TabsTrigger value='insights'>
              {t('report.tabs.insights', 'Insights')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='mt-6'>
            <CategoryPerformanceSection
              transactions={monthTransactions}
              selectedMonth={selectedMonth}
              walletId={selectedWalletId || ''}
              currency={currency}
            />
          </TabsContent>

          <TabsContent value='income' className='mt-6'>
            <IncomeAnalysisSection
              transactions={monthTransactions}
              selectedMonth={selectedMonth}
              walletId={selectedWalletId || ''}
              currency={currency}
            />
          </TabsContent>

          <TabsContent value='expenses' className='mt-6'>
            <ExpenseAnalysisSection
              transactions={monthTransactions}
              selectedMonth={selectedMonth}
              walletId={selectedWalletId || ''}
              currency={currency}
            />
          </TabsContent>

          <TabsContent value='insights' className='mt-6'>
            <TransactionInsightsSection
              transactions={monthTransactions}
              currency={currency}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
