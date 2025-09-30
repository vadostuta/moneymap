'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'
import { usePrivacy } from '@/contexts/privacy-context'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/lib/services/category'
import { transactionService } from '@/lib/services/transaction'
import { Transaction } from '@/lib/types/transaction'
import {
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { getTranslatedCategoryName } from '@/lib/categories-translations-mapper'

interface CategoryPerformanceSectionProps {
  transactions: Transaction[]
  selectedMonth: Date
  walletId: string
  currency: string
}

interface CategoryComparison {
  categoryId: string
  name: string
  currentMonth: number
  previousMonth: number
  change: number
  percentageChange: number
}

export function CategoryPerformanceSection ({
  transactions,
  selectedMonth,
  walletId,
  currency
}: CategoryPerformanceSectionProps) {
  const { t } = useTranslation('common')
  const { formatAmount } = usePrivacy()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAllCategories()
  })

  // Fetch previous month's transactions
  const previousMonth = useMemo(() => {
    const prev = new Date(selectedMonth)
    prev.setMonth(prev.getMonth() - 1)
    return prev
  }, [selectedMonth])

  const { data: previousMonthTransactions = [] } = useQuery({
    queryKey: [
      'previous-month-transactions',
      walletId,
      previousMonth.getFullYear(),
      previousMonth.getMonth()
    ],
    queryFn: async () => {
      if (!walletId) return []

      const year = previousMonth.getFullYear()
      const month = previousMonth.getMonth()
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0)

      const allTransactions = await transactionService.getAll()

      return allTransactions.filter(t => {
        const transactionDate = new Date(t.date)
        const isInDateRange =
          transactionDate >= startDate && transactionDate <= endDate
        const isNotDeleted = !t.is_deleted && !t.is_hidden
        const isCorrectWallet = walletId === 'all' || t.wallet_id === walletId

        return isInDateRange && isNotDeleted && isCorrectWallet
      })
    },
    enabled: !!walletId
  })

  // Calculate category performance comparison
  const categoryPerformance = useMemo(() => {
    const currentExpenses = transactions.filter(
      t => t.type === 'expense' && t.category_id !== 'Transfers'
    )
    const previousExpenses = previousMonthTransactions.filter(
      t => t.type === 'expense' && t.category_id !== 'Transfers'
    )

    const currentMap = new Map<string, number>()
    const previousMap = new Map<string, number>()

    currentExpenses.forEach(t => {
      const current = currentMap.get(t.category_id) || 0
      currentMap.set(t.category_id, current + t.amount)
    })

    previousExpenses.forEach(t => {
      const current = previousMap.get(t.category_id) || 0
      previousMap.set(t.category_id, current + t.amount)
    })

    const allCategories = new Set([...currentMap.keys(), ...previousMap.keys()])

    const comparisons: CategoryComparison[] = []

    allCategories.forEach(categoryId => {
      const currentMonth = currentMap.get(categoryId) || 0
      const previousMonth = previousMap.get(categoryId) || 0
      const change = currentMonth - previousMonth
      const percentageChange =
        previousMonth > 0 ? (change / previousMonth) * 100 : 0

      const category = categories.find(c => c.id === categoryId)
      const name = category
        ? getTranslatedCategoryName(category.name, t)
        : categoryId

      comparisons.push({
        categoryId,
        name,
        currentMonth,
        previousMonth,
        change,
        percentageChange
      })
    })

    return comparisons.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  }, [transactions, previousMonthTransactions, categories, t])

  const biggestIncrease = categoryPerformance.filter(c => c.change > 0)[0]
  const biggestDecrease = categoryPerformance.filter(c => c.change < 0)[0]

  return (
    <div className='space-y-6'>
      {/* Month-over-Month Highlights */}
      <div className='grid md:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-red-600'>
              <TrendingUp className='h-5 w-5' />
              {t('report.performance.biggestIncrease', 'Biggest Increase')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {biggestIncrease ? (
              <div>
                <div className='text-2xl font-bold mb-2'>
                  {biggestIncrease.name}
                </div>
                <div className='flex items-center gap-2 text-red-600'>
                  <ArrowUp className='h-4 w-4' />
                  <span className='font-semibold'>
                    {formatAmount(Math.abs(biggestIncrease.change), currency)}
                  </span>
                  <span className='text-sm'>
                    ({biggestIncrease.percentageChange.toFixed(1)}%)
                  </span>
                </div>
                <div className='mt-2 text-sm text-muted-foreground'>
                  {t('report.performance.from', 'From')}{' '}
                  {formatAmount(biggestIncrease.previousMonth, currency)}{' '}
                  {t('report.performance.to', 'to')}{' '}
                  {formatAmount(biggestIncrease.currentMonth, currency)}
                </div>
              </div>
            ) : (
              <div className='text-muted-foreground'>
                {t('report.performance.noIncrease', 'No increases this month')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-green-600'>
              <TrendingDown className='h-5 w-5' />
              {t('report.performance.biggestDecrease', 'Biggest Decrease')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {biggestDecrease ? (
              <div>
                <div className='text-2xl font-bold mb-2'>
                  {biggestDecrease.name}
                </div>
                <div className='flex items-center gap-2 text-green-600'>
                  <ArrowDown className='h-4 w-4' />
                  <span className='font-semibold'>
                    {formatAmount(Math.abs(biggestDecrease.change), currency)}
                  </span>
                  <span className='text-sm'>
                    ({Math.abs(biggestDecrease.percentageChange).toFixed(1)}%)
                  </span>
                </div>
                <div className='mt-2 text-sm text-muted-foreground'>
                  {t('report.performance.from', 'From')}{' '}
                  {formatAmount(biggestDecrease.previousMonth, currency)}{' '}
                  {t('report.performance.to', 'to')}{' '}
                  {formatAmount(biggestDecrease.currentMonth, currency)}
                </div>
              </div>
            ) : (
              <div className='text-muted-foreground'>
                {t('report.performance.noDecrease', 'No decreases this month')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t(
              'report.performance.categoryComparison',
              'Category Performance Comparison'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {categoryPerformance.slice(0, 10).map(cat => {
              const isIncrease = cat.change > 0
              const isDecrease = cat.change < 0
              const isNoChange = cat.change === 0

              return (
                <div
                  key={cat.categoryId}
                  className='flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors'
                >
                  <div className='flex-1'>
                    <div className='font-medium'>{cat.name}</div>
                    <div className='text-sm text-muted-foreground'>
                      {formatAmount(cat.previousMonth, currency)} →{' '}
                      {formatAmount(cat.currentMonth, currency)}
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='text-right'>
                      <div
                        className={`flex items-center gap-1 ${
                          isIncrease
                            ? 'text-red-600'
                            : isDecrease
                            ? 'text-green-600'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {isIncrease && <ArrowUp className='h-4 w-4' />}
                        {isDecrease && <ArrowDown className='h-4 w-4' />}
                        {isNoChange && <Minus className='h-4 w-4' />}
                        <span className='font-semibold'>
                          {formatAmount(Math.abs(cat.change), currency)}
                        </span>
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {cat.percentageChange !== 0 &&
                          `${
                            cat.percentageChange > 0 ? '+' : ''
                          }${cat.percentageChange.toFixed(1)}%`}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
