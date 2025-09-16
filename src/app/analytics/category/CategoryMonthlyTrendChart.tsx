'use client'

import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { transactionService } from '@/lib/services/transaction'
import { useWallet } from '@/contexts/wallet-context'
import { useTranslation } from 'react-i18next'
import { usePrivacy } from '@/contexts/privacy-context'
import { Button } from '@/components/ui/button'
import { Calendar, BarChart3, X } from 'lucide-react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { categoryService } from '@/lib/services/category'

interface CategoryMonthlyTrendChartProps {
  walletId: string
  categoryId: string | null
  availableMonths: Date[]
  isAllWallets?: boolean
}

type ViewMode = 'monthly' | 'daily'

export function CategoryMonthlyTrendChart ({
  walletId,
  categoryId,
  availableMonths,
  isAllWallets = false
}: CategoryMonthlyTrendChartProps) {
  const { t } = useTranslation('common')
  const { formatAmount } = usePrivacy()
  const { selectedWallet } = useWallet()
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Fetch categories to filter out transfers
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories
  })

  // Get transfers category ID
  const transfersCategoryId = categories.find(
    cat => cat.name === 'Transfers'
  )?.id

  // Update the query to handle "All wallets" case
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['category-monthly-trend', walletId, categoryId, isAllWallets],
    queryFn: async () => {
      if (!categoryId) {
        // Get total spending for all categories (excluding transfers)
        const monthlyTotals = await Promise.all(
          availableMonths.map(async month => {
            const year = month.getFullYear()
            const monthIndex = month.getMonth()

            if (isAllWallets) {
              // For "All wallets", get data from all wallets
              const expenses =
                await transactionService.getMonthlyExpensesByCategory(
                  'all', // This should work if the service supports it
                  year,
                  monthIndex
                )
              // Filter out transfers
              const filteredExpenses = expenses.filter(
                item => item.category_id !== transfersCategoryId
              )
              return {
                month: month.toISOString(),
                total: filteredExpenses.reduce(
                  (sum, item) => sum + item.amount,
                  0
                )
              }
            } else {
              // For single wallet
              const expenses =
                await transactionService.getMonthlyExpensesByCategory(
                  walletId,
                  year,
                  monthIndex
                )
              // Filter out transfers
              const filteredExpenses = expenses.filter(
                item => item.category_id !== transfersCategoryId
              )
              return {
                month: month.toISOString(),
                total: filteredExpenses.reduce(
                  (sum, item) => sum + item.amount,
                  0
                )
              }
            }
          })
        )
        return monthlyTotals
      } else {
        // Get spending for specific category (already filtered by categoryId)
        const monthlyTotals = await Promise.all(
          availableMonths.map(async month => {
            const year = month.getFullYear()
            const monthIndex = month.getMonth()

            if (isAllWallets) {
              // For "All wallets", get data from all wallets
              const expenses =
                await transactionService.getMonthlyExpensesByCategory(
                  'all',
                  year,
                  monthIndex
                )
              const categoryExpenses = expenses.filter(
                item => item.category_id === categoryId
              )
              return {
                month: month.toISOString(),
                total: categoryExpenses.reduce(
                  (sum, item) => sum + item.amount,
                  0
                )
              }
            } else {
              // For single wallet
              const expenses =
                await transactionService.getMonthlyExpensesByCategory(
                  walletId,
                  year,
                  monthIndex
                )
              const categoryExpenses = expenses.filter(
                item => item.category_id === categoryId
              )
              return {
                month: month.toISOString(),
                total: categoryExpenses.reduce(
                  (sum, item) => sum + item.amount,
                  0
                )
              }
            }
          })
        )
        return monthlyTotals
      }
    },
    enabled: availableMonths.length > 0
  })

  // Fetch daily data for the selected category or all categories
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-trend', walletId, categoryId, transfersCategoryId],
    queryFn: async () => {
      if (!walletId || availableMonths.length === 0) return []

      const data: Array<{
        day: string
        amount: number
        date: Date
        dateKey: string
      }> = []
      const currentDate = new Date()
      const startDate = new Date(currentDate.getFullYear() - 1, 0, 1) // Last year

      try {
        // Get all transactions for the date range
        const allTransactions = await transactionService.getAll()

        // Filter transactions for the selected wallet and date range, excluding transfers
        const filteredTransactions = allTransactions.filter(
          t =>
            t.wallet_id === walletId &&
            new Date(t.date) >= startDate &&
            t.type === 'expense' &&
            !t.is_deleted &&
            !t.is_hidden &&
            t.category_id !== transfersCategoryId // Filter out transfers
        )

        // Group by day
        const dailyMap = new Map<string, number>()

        filteredTransactions.forEach(transaction => {
          const date = new Date(transaction.date)
          const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD format

          if (categoryId) {
            // Specific category
            if (transaction.category_id === categoryId) {
              dailyMap.set(
                dateKey,
                (dailyMap.get(dateKey) || 0) + transaction.amount
              )
            }
          } else {
            // All categories - we'll filter out transfers later when we have category data
            dailyMap.set(
              dateKey,
              (dailyMap.get(dateKey) || 0) + transaction.amount
            )
          }
        })

        // Convert to array and sort by date
        const sortedDates = Array.from(dailyMap.keys()).sort()

        // Take last 90 days for daily view
        const recentDates = sortedDates.slice(-90)

        recentDates.forEach(dateKey => {
          const date = new Date(dateKey)
          data.push({
            day: date.toLocaleDateString('en', {
              month: 'short',
              day: 'numeric'
            }),
            amount: dailyMap.get(dateKey) || 0,
            date: date,
            dateKey: dateKey
          })
        })

        return data
      } catch (error) {
        console.error('Error fetching daily data:', error)
        return []
      }
    },
    enabled: !!walletId && availableMonths.length > 0
  })

  // Fetch transactions for selected date
  const { data: dateTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: [
      'date-transactions',
      walletId,
      selectedDate,
      categoryId,
      viewMode
    ],
    queryFn: async () => {
      if (!walletId || !selectedDate) return []

      try {
        const allTransactions = await transactionService.getAll()

        let filteredTransactions = allTransactions.filter(
          t =>
            t.wallet_id === walletId &&
            t.type === 'expense' &&
            !t.is_deleted &&
            !t.is_hidden
        )

        // Filter by date
        if (viewMode === 'monthly') {
          // For monthly view, filter by month
          const [year, month] = selectedDate.split('-')
          filteredTransactions = filteredTransactions.filter(t => {
            const date = new Date(t.date)
            return (
              date.getFullYear() === parseInt(year) &&
              date.getMonth() === parseInt(month)
            )
          })
        } else {
          // For daily view, filter by exact date
          filteredTransactions = filteredTransactions.filter(t => {
            const date = new Date(t.date)
            const dateKey = date.toISOString().split('T')[0]
            return dateKey === selectedDate
          })
        }

        // Filter by category if selected
        if (categoryId) {
          filteredTransactions = filteredTransactions.filter(
            t => t.category_id === categoryId
          )
        }

        return filteredTransactions
      } catch (error) {
        console.error('Error fetching date transactions:', error)
        return []
      }
    },
    enabled: !!walletId && !!selectedDate
  })

  const formatCurrency = (amount: number) => {
    const currency = selectedWallet?.currency || 'UAH'
    return formatAmount(amount, currency)
  }

  const chartData = useMemo(() => {
    const data = viewMode === 'monthly' ? monthlyData : dailyData
    if (!data) return []

    return data.map(item => ({
      ...item,
      amount:
        Math.round(('amount' in item ? item.amount : item.total) * 100) / 100
    }))
  }, [monthlyData, dailyData, viewMode])

  const isLoading = viewMode === 'monthly' ? monthlyLoading : dailyLoading

  const handleChartClick = (data: { activeLabel?: string }, index: number) => {
    console.log('Chart clicked:', data, index)

    // Find the data point based on the activeLabel
    if (data && data.activeLabel) {
      const clickedData = chartData.find(item => {
        if (viewMode === 'monthly') {
          return 'month' in item && item.month === data.activeLabel
        } else {
          return 'day' in item && item.day === data.activeLabel
        }
      })

      if (clickedData && 'dateKey' in clickedData && clickedData.dateKey) {
        console.log('Setting selected date from chart:', clickedData.dateKey)
        setSelectedDate(clickedData.dateKey)
      }
    }
  }

  const handleCloseTransactions = () => {
    setSelectedDate(null)
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-80'>
        <div className='text-muted-foreground'>Loading...</div>
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className='flex items-center justify-center h-80 text-muted-foreground'>
        {t('analytics.noDataForMonth')}
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* View Mode Toggle */}
      <div className='flex justify-center gap-2'>
        <Button
          variant={viewMode === 'monthly' ? 'default' : 'outline'}
          size='sm'
          onClick={() => setViewMode('monthly')}
          className='flex items-center gap-2'
        >
          <BarChart3 className='h-4 w-4' />
          Monthly
        </Button>
        <Button
          variant={viewMode === 'daily' ? 'default' : 'outline'}
          size='sm'
          onClick={() => setViewMode('daily')}
          className='flex items-center gap-2'
        >
          <Calendar className='h-4 w-4' />
          Daily
        </Button>
      </div>

      {/* Chart */}
      <div className='h-80 w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={chartData} onClick={handleChartClick}>
            <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
            <XAxis
              dataKey={viewMode === 'monthly' ? 'month' : 'day'}
              stroke='#6B7280'
              fontSize={12}
              angle={viewMode === 'daily' ? -45 : 0}
              textAnchor={viewMode === 'daily' ? 'end' : 'middle'}
              height={viewMode === 'daily' ? 60 : 30}
              style={{ cursor: 'pointer' }}
            />
            <YAxis
              stroke='#6B7280'
              fontSize={12}
              tickFormatter={value => formatCurrency(value)}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className='bg-background border border-border rounded-lg p-3 shadow-lg'>
                      <p className='font-medium'>{label}</p>
                      <p className='text-primary'>
                        {formatCurrency(payload[0]?.value as number)}
                      </p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        Click to view transactions
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />
            <Line
              type='monotone'
              dataKey='amount'
              stroke={categoryId ? '#3B82F6' : '#10B981'}
              strokeWidth={3}
              dot={{
                fill: categoryId ? '#3B82F6' : '#10B981',
                strokeWidth: 2,
                r: viewMode === 'daily' ? 2 : 4
              }}
              activeDot={{
                r: viewMode === 'daily' ? 4 : 6,
                stroke: categoryId ? '#3B82F6' : '#10B981',
                strokeWidth: 2
              }}
              name={
                categoryId
                  ? t('analytics.categorySpending')
                  : t('analytics.totalSpending')
              }
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions for Selected Date */}
      {selectedDate && dateTransactions && (
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-lg'>
                {t('analytics.transactionsFor')}
                {viewMode === 'monthly'
                  ? new Date(selectedDate + '-01').toLocaleDateString('en', {
                      month: 'long',
                      year: 'numeric'
                    })
                  : new Date(selectedDate).toLocaleDateString('en', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
              </CardTitle>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleCloseTransactions}
                className='h-8 w-8 p-0'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className='text-center py-4'>
                {t('analytics.loadingTransactions')}
              </div>
            ) : dateTransactions.length > 0 ? (
              <div className='space-y-3 max-h-96 overflow-y-auto'>
                {dateTransactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'
                  >
                    <div className='flex-1'>
                      <div className='font-medium'>
                        {transaction.description}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className='font-bold text-primary'>
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-4 text-muted-foreground'>
                {t('analytics.noTransactionsForPeriod', {
                  period:
                    viewMode === 'monthly'
                      ? t('analytics.month')
                      : t('analytics.day')
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
