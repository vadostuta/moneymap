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

export function AnalyticsCategoryClient () {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { selectedWallet, isAllWalletsSelected, wallets } = useWallet()
  const { t } = useTranslation('common')
  const selectedWalletId = selectedWallet?.id || ''

  // Get wallets sorted by transaction amount for "All wallets" mode
  const { data: sortedWallets = [], isLoading: sortedWalletsLoading } =
    useQuery({
      queryKey: [
        'sorted-wallets-category',
        isAllWalletsSelected,
        wallets.map(w => w.id)
      ],
      queryFn: async () => {
        if (!isAllWalletsSelected) {
          const currentWallet = wallets.find(w => w.id === selectedWalletId)
          return currentWallet ? [currentWallet] : []
        }

        if (wallets.length === 0) return []

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
    queryKey: ['wallet-transactions', selectedWalletId],
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
              t.type === 'expense' &&
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

  // Calculate category totals for bubble chart
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

    // Sum up expenses by category
    allTransactions.forEach(transaction => {
      if (transaction.category_id && totals.has(transaction.category_id)) {
        const current = totals.get(transaction.category_id)!
        current.total += transaction.amount
      }
    })

    // Filter out categories with 0 spending and sort by total
    return Array.from(totals.values())
      .filter(cat => cat.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [allTransactions, categories])

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

  const handleBackToOverview = () => {
    setSelectedCategory(null)
  }

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
        // Multiple charts for each wallet
        <div className='space-y-8'>
          {sortedWallets.map(wallet => (
            <div key={wallet.id} className='space-y-6'>
              {/* Wallet Header */}
              <div className='text-center'>
                <h2 className='text-2xl font-bold text-foreground'>
                  {wallet.name}
                </h2>
                <p className='text-muted-foreground'>Category Analytics</p>
              </div>

              {/* Category Bubble Chart */}
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
                    data={categoryTotals.filter(cat =>
                      allTransactions?.some(
                        t =>
                          t.wallet_id === wallet.id && t.category_id === cat.id
                      )
                    )}
                    selectedCategory={selectedCategory}
                    onCategorySelect={handleCategorySelect}
                  />
                </CardContent>
              </Card>

              {/* Monthly Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedCategory
                      ? `${
                          categories?.find(c => c.id === selectedCategory)
                            ?.name || 'Unknown'
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
                    walletId={wallet.id}
                    categoryId={selectedCategory}
                    availableMonths={availableMonths}
                    isAllWallets={false}
                  />
                </CardContent>
              </Card>
            </div>
          ))}
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
      {selectedCategory && (
        <div className='flex justify-center'>
          <Button onClick={handleBackToOverview} variant='outline'>
            {t('analytics.allCategories')}
          </Button>
        </div>
      )}
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
