'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { transactionService } from '@/lib/services/transaction'
import { categoryService } from '@/lib/services/category'
import { useWallet } from '@/contexts/wallet-context'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryBubbleChart } from '../components/CategoryBubbleChart'
import { CategoryMonthlyTrendChart } from '../components/CategoryMonthlyTrendChart'
import { Button } from '@/components/ui/button'
import { BarChart3 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function AnalyticsCategoryClient () {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [dataType, setDataType] = useState<'net' | 'expense' | 'income'>('net')
  const { selectedWallet, isAllWalletsSelected, wallets } = useWallet()
  const { t } = useTranslation('common')
  const selectedWalletId = selectedWallet?.id || ''

  // Get wallets sorted by transaction amount for "All wallets" mode
  const { data: sortedWallets = [], isLoading: sortedWalletsLoading } =
    useQuery({
      queryKey: [
        'sorted-wallets-category',
        isAllWalletsSelected,
        wallets.map(w => w.id),
        dataType
      ],
      queryFn: async () => {
        if (!isAllWalletsSelected) {
          const currentWallet = wallets.find(w => w.id === selectedWalletId)
          return currentWallet ? [currentWallet] : []
        }

        if (wallets.length === 0) return []

        // Calculate total transaction amount for each wallet based on data type
        const walletAmounts = await Promise.all(
          wallets.map(async wallet => {
            try {
              let totalAmount = 0

              if (dataType === 'net') {
                const netData =
                  await transactionService.getCurrentMonthNetByCategory(
                    wallet.id
                  )
                totalAmount = netData.reduce(
                  (sum, item) => sum + item.amount,
                  0
                )
              } else if (dataType === 'expense') {
                const expenses =
                  await transactionService.getCurrentMonthExpensesByCategory(
                    wallet.id
                  )
                totalAmount = expenses.reduce(
                  (sum, item) => sum + item.amount,
                  0
                )
              } else {
                const income =
                  await transactionService.getCurrentMonthIncomeByCategory(
                    wallet.id
                  )
                totalAmount = income.reduce((sum, item) => sum + item.amount, 0)
              }

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
        return walletAmounts
          .filter(item => item.totalAmount > 0)
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .map(item => item.wallet)
      },
      enabled: wallets.length > 0
    })

  // Fetch all categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAllCategories(),
    enabled: true
  })

  // Fetch all transactions for the selected wallet(s) to determine available months
  const { data: allTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['wallet-transactions', selectedWalletId, dataType],
    queryFn: async () => {
      if (!selectedWalletId) return []

      try {
        const currentDate = new Date()
        const startDate = new Date(currentDate.getFullYear() - 2, 0, 1)

        if (isAllWalletsSelected) {
          // For "All wallets", get transactions from all wallets
          const allTransactions = await transactionService.getAll()

          const filteredTransactions = allTransactions.filter(
            t =>
              new Date(t.date) >= startDate &&
              (dataType === 'expense'
                ? t.type === 'expense'
                : dataType === 'income'
                ? t.type === 'income'
                : true) &&
              !t.is_deleted &&
              !t.is_hidden
          )

          return filteredTransactions
        } else {
          // For single wallet, use existing logic
          const allTransactions = await transactionService.getAll()

          const filteredTransactions = allTransactions.filter(
            t =>
              t.wallet_id === selectedWalletId &&
              new Date(t.date) >= startDate &&
              (dataType === 'expense'
                ? t.type === 'expense'
                : dataType === 'income'
                ? t.type === 'income'
                : true) &&
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

  // Calculate category totals for bubble chart based on data type
  const categoryTotals = useMemo(() => {
    if (!allTransactions || !categories) return []

    const totals = new Map<
      string,
      { id: string; name: string; total: number; color: string }
    >()

    // Initialize all categories with 0, excluding Transfers
    categories
      .filter(cat => cat.name !== 'Transfers')
      .forEach(cat => {
        totals.set(cat.id, {
          id: cat.id,
          name: cat.name,
          total: 0,
          color: getCategoryColor(cat.name)
        })
      })

    if (dataType === 'net') {
      // For net, we need to calculate expenses - income per category
      const categoryNet = new Map<
        string,
        { expenses: number; income: number }
      >()

      allTransactions.forEach(transaction => {
        if (transaction.category_id && totals.has(transaction.category_id)) {
          if (!categoryNet.has(transaction.category_id)) {
            categoryNet.set(transaction.category_id, { expenses: 0, income: 0 })
          }

          const current = categoryNet.get(transaction.category_id)!
          if (transaction.type === 'expense') {
            current.expenses += transaction.amount
          } else if (transaction.type === 'income') {
            current.income += transaction.amount
          }
        }
      })

      // Calculate net amounts and update totals
      categoryNet.forEach((amounts, categoryId) => {
        const netAmount = amounts.expenses - amounts.income
        if (netAmount > 0 && totals.has(categoryId)) {
          const current = totals.get(categoryId)!
          current.total = netAmount
        }
      })
    } else {
      // For expense or income, sum up by category
      allTransactions.forEach(transaction => {
        if (transaction.category_id && totals.has(transaction.category_id)) {
          const current = totals.get(transaction.category_id)!
          current.total += transaction.amount
        }
      })
    }

    return Array.from(totals.values())
      .filter(cat => cat.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [allTransactions, categories, dataType])

  // Get available months for trend chart
  const availableMonths = useMemo(() => {
    if (!allTransactions || allTransactions.length === 0) return []

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

    return Array.from(monthMap.values()).sort(
      (a, b) => a.getTime() - b.getTime()
    )
  }, [allTransactions])

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
  }

  const handleTypeChange = (type: 'net' | 'expense' | 'income') => {
    setDataType(type)
    setSelectedCategory(null) // Reset selected category when changing type
  }

  // const handleBackToOverview = () => {
  //   setSelectedCategory(null)
  // }

  const isLoading =
    categoriesLoading || transactionsLoading || sortedWalletsLoading

  if (isLoading) {
    return (
      <div className='w-full max-w-none space-y-6 px-6'>
        <div className='space-y-6'>
          <Skeleton className='h-64 w-full' />
          <Skeleton className='h-96 w-full' />
        </div>
      </div>
    )
  }

  return (
    <div className='w-full max-w-none space-y-6 px-6'>
      {isAllWalletsSelected ? (
        // Multiple charts for all wallets
        <div className='space-y-6'>
          {sortedWalletsLoading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className='h-6 w-32' />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className='h-32 w-full' />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {sortedWallets.map(wallet => (
                <Card key={wallet.id}>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <BarChart3 className='h-5 w-5' />
                      {wallet.name}
                    </CardTitle>
                    <p className='text-sm text-muted-foreground'>
                      {t('analytics.clickToSelect')}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <CategoryBubbleChart
                      data={categoryTotals}
                      selectedCategory={selectedCategory}
                      onCategorySelect={handleCategorySelect}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Single chart for selected wallet
        <>
          {/* Category Bubble Chart - Top */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='h-5 w-5' />
                {t('analytics.expensesByCategory')}
              </CardTitle>
              <p className='text-sm text-muted-foreground'>
                {t('analytics.clickToSelect')}
              </p>
            </CardHeader>
            <CardContent>
              <CategoryBubbleChart
                data={categoryTotals}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
                type={dataType}
                onTypeChange={handleTypeChange}
              />
            </CardContent>
          </Card>

          {/* Monthly Trend Chart - Bottom */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedCategory
                  ? `${
                      categories?.find(c => c.id === selectedCategory)?.name ||
                      'Unknown'
                    } - ${t('analytics.monthlyTrend')}`
                  : t('analytics.totalSpending')}
              </CardTitle>
              <p className='text-sm text-muted-foreground'>
                {selectedCategory
                  ? t('analytics.monthlyTrend')
                  : t('analytics.noCategorySelected')}
              </p>
            </CardHeader>
            <CardContent>
              <CategoryMonthlyTrendChart
                walletId={selectedWalletId}
                categoryId={selectedCategory}
                availableMonths={availableMonths}
                isAllWallets={isAllWalletsSelected}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Back to Overview Button */}
      <div className='flex justify-center'>
        <Button
          variant='outline'
          onClick={() => window.history.back()}
          className='mt-6'
        >
          {t('common.back')}
        </Button>
      </div>
    </div>
  )
}

// Helper function to generate consistent colors for categories
function getCategoryColor (categoryName: string): string {
  const colors = [
    '#3B82F6',
    '#EF4444',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#6366F1',
    '#14B8A6',
    '#F43F5E',
    '#A855F7',
    '#22C55E',
    '#EAB308'
  ]

  let hash = 0
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}
