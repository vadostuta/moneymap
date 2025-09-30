'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'
import { usePrivacy } from '@/contexts/privacy-context'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/lib/services/category'
import { Transaction } from '@/lib/types/transaction'
import { getTranslatedCategoryName } from '@/lib/categories-translations-mapper'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  Clock
} from 'lucide-react'

interface TransactionInsightsSectionProps {
  transactions: Transaction[]
  currency: string
}

export function TransactionInsightsSection ({
  transactions,
  currency
}: TransactionInsightsSectionProps) {
  const { t, i18n } = useTranslation('common')
  const { formatAmount } = usePrivacy()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAllCategories()
  })

  // Get largest transactions
  const largestTransactions = useMemo(() => {
    return [...transactions]
      .filter(transaction => transaction.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map(transaction => {
        const category = categories.find(c => c.id === transaction.category_id)
        return {
          ...transaction,
          categoryName: category
            ? getTranslatedCategoryName(category.name, t)
            : transaction.category_id
        }
      })
  }, [transactions, categories, t])

  // Calculate average transaction amount
  const averageTransactionAmount = useMemo(() => {
    const expenseTransactions = transactions.filter(
      transaction => transaction.type === 'expense'
    )
    if (expenseTransactions.length === 0) return 0
    const total = expenseTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    )
    return total / expenseTransactions.length
  }, [transactions])

  // Find unusual transactions (significantly above average)
  const unusualTransactions = useMemo(() => {
    const threshold = averageTransactionAmount * 2 // 2x average
    return largestTransactions.filter(
      transaction => transaction.amount > threshold
    )
  }, [largestTransactions, averageTransactionAmount])

  // Calculate transaction frequency by category
  const transactionFrequency = useMemo(() => {
    const frequencyMap = new Map<string, number>()

    transactions.forEach(transaction => {
      const count = frequencyMap.get(transaction.category_id) || 0
      frequencyMap.set(transaction.category_id, count + 1)
    })

    return Array.from(frequencyMap.entries())
      .map(([categoryId, count]) => {
        const category = categories.find(c => c.id === categoryId)
        return {
          categoryId,
          name: category
            ? getTranslatedCategoryName(category.name, t)
            : categoryId,
          count
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [transactions, categories, t])

  // Group transactions by time of day
  const transactionsByTimeOfDay = useMemo(() => {
    const morning = transactions.filter(transaction => {
      const hour = new Date(transaction.date).getHours()
      return hour >= 6 && hour < 12
    }).length

    const afternoon = transactions.filter(transaction => {
      const hour = new Date(transaction.date).getHours()
      return hour >= 12 && hour < 18
    }).length

    const evening = transactions.filter(transaction => {
      const hour = new Date(transaction.date).getHours()
      return hour >= 18 && hour < 24
    }).length

    const night = transactions.filter(transaction => {
      const hour = new Date(transaction.date).getHours()
      return hour >= 0 && hour < 6
    }).length

    return { morning, afternoon, evening, night }
  }, [transactions])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className='space-y-6'>
      {/* Largest Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ArrowUpCircle className='h-5 w-5 text-red-600' />
            {t('report.insights.largestTransactions', 'Largest Transactions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {largestTransactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className='flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div className='text-lg font-semibold text-muted-foreground'>
                    #{index + 1}
                  </div>
                  <div>
                    <div className='font-medium'>
                      {transaction.description || transaction.categoryName}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      {transaction.categoryName} •{' '}
                      {formatDate(transaction.date)}
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='font-bold text-red-600'>
                    {formatAmount(transaction.amount, currency)}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {transaction.wallet.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className='grid md:grid-cols-2 gap-6'>
        {/* Unusual Spending */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-orange-600' />
              {t('report.insights.unusualSpending', 'Unusual Spending')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='mb-4'>
              <div className='text-sm text-muted-foreground'>
                {t('report.insights.averageTransaction', 'Average Transaction')}
              </div>
              <div className='text-xl font-bold'>
                {formatAmount(averageTransactionAmount, currency)}
              </div>
            </div>
            {unusualTransactions.length > 0 ? (
              <div className='space-y-2'>
                <div className='text-sm font-medium mb-2'>
                  {t(
                    'report.insights.aboveAverage',
                    'Transactions above 2x average:'
                  )}
                </div>
                {unusualTransactions.slice(0, 5).map(transaction => (
                  <div
                    key={transaction.id}
                    className='p-2 rounded bg-orange-100 dark:bg-orange-900/20'
                  >
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>
                        {transaction.description || transaction.categoryName}
                      </span>
                      <span className='text-sm font-semibold text-orange-600'>
                        {formatAmount(transaction.amount, currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-sm text-muted-foreground'>
                {t(
                  'report.insights.noUnusual',
                  'No unusual transactions detected'
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Frequent Categories */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <ArrowDownCircle className='h-5 w-5 text-blue-600' />
              {t(
                'report.insights.frequentCategories',
                'Most Frequent Categories'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {transactionFrequency.map((freq, index) => (
                <div key={freq.categoryId} className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      {index + 1}. {freq.name}
                    </span>
                    <span className='text-sm font-semibold text-blue-600'>
                      {freq.count}{' '}
                      {t('report.insights.transactions', 'transactions')}
                    </span>
                  </div>
                  <div className='w-full bg-muted rounded-full h-2'>
                    <div
                      className='bg-blue-500 h-2 rounded-full transition-all'
                      style={{
                        width: `${(freq.count / transactions.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Patterns by Time */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5 text-purple-600' />
            {t(
              'report.insights.transactionTiming',
              'Transaction Timing Patterns'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg text-center'>
              <div className='text-sm text-muted-foreground mb-1'>
                🌅 {t('report.insights.morning', 'Morning')}
              </div>
              <div className='text-2xl font-bold'>
                {transactionsByTimeOfDay.morning}
              </div>
              <div className='text-xs text-muted-foreground'>6am - 12pm</div>
            </div>
            <div className='p-4 bg-orange-100 dark:bg-orange-900/20 rounded-lg text-center'>
              <div className='text-sm text-muted-foreground mb-1'>
                ☀️ {t('report.insights.afternoon', 'Afternoon')}
              </div>
              <div className='text-2xl font-bold'>
                {transactionsByTimeOfDay.afternoon}
              </div>
              <div className='text-xs text-muted-foreground'>12pm - 6pm</div>
            </div>
            <div className='p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-center'>
              <div className='text-sm text-muted-foreground mb-1'>
                🌆 {t('report.insights.evening', 'Evening')}
              </div>
              <div className='text-2xl font-bold'>
                {transactionsByTimeOfDay.evening}
              </div>
              <div className='text-xs text-muted-foreground'>6pm - 12am</div>
            </div>
            <div className='p-4 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg text-center'>
              <div className='text-sm text-muted-foreground mb-1'>
                🌙 {t('report.insights.night', 'Night')}
              </div>
              <div className='text-2xl font-bold'>
                {transactionsByTimeOfDay.night}
              </div>
              <div className='text-xs text-muted-foreground'>12am - 6am</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
