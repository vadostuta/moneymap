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

interface CategoryMonthlyTrendChartProps {
  walletId: string
  categoryId: string | null
  availableMonths: Date[]
}

type ViewMode = 'monthly' | 'daily'

export function CategoryMonthlyTrendChart ({
  walletId,
  categoryId,
  availableMonths
}: CategoryMonthlyTrendChartProps) {
  const { t } = useTranslation('common')
  const { formatAmount } = usePrivacy()
  const { selectedWallet } = useWallet()
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Fetch monthly data for the selected category or all categories
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthly-trend', walletId, categoryId],
    queryFn: async () => {
      if (!walletId || availableMonths.length === 0) return []

      const data: Array<{
        month: string
        amount: number
        date: Date
        dateKey: string
      }> = []

      for (const month of availableMonths) {
        const year = month.getFullYear()
        const monthNum = month.getMonth()

        try {
          if (categoryId) {
            // Get expenses for specific category
            const expenses =
              await transactionService.getMonthlyExpensesByCategory(
                walletId,
                year,
                monthNum
              )

            const categoryExpense = expenses.find(
              e => e.category_id === categoryId
            )
            data.push({
              month: month.toLocaleDateString('en', {
                month: 'short',
                year: '2-digit'
              }),
              amount: categoryExpense?.amount || 0,
              date: month,
              dateKey: `${year}-${monthNum.toString().padStart(2, '0')}`
            })
          } else {
            // Get total expenses for all categories
            const expenses =
              await transactionService.getMonthlyExpensesByCategory(
                walletId,
                year,
                monthNum
              )

            const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
            data.push({
              month: month.toLocaleDateString('en', {
                month: 'short',
                year: '2-digit'
              }),
              amount: totalAmount,
              date: month,
              dateKey: `${year}-${monthNum.toString().padStart(2, '0')}`
            })
          }
        } catch (error) {
          console.error(`Error fetching data for ${year}-${monthNum}:`, error)
          data.push({
            month: month.toLocaleDateString('en', {
              month: 'short',
              year: '2-digit'
            }),
            amount: 0,
            date: month,
            dateKey: `${year}-${monthNum.toString().padStart(2, '0')}`
          })
        }
      }

      return data
    },
    enabled: !!walletId && availableMonths.length > 0
  })

  // Fetch daily data for the selected category or all categories
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-trend', walletId, categoryId],
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

        // Filter transactions for the selected wallet and date range
        const filteredTransactions = allTransactions.filter(
          t =>
            t.wallet_id === walletId &&
            new Date(t.date) >= startDate &&
            t.type === 'expense' &&
            !t.is_deleted &&
            !t.is_hidden
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
            // All categories
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

  const currency = selectedWallet?.currency || 'UAH'

  // Format currency using privacy context
  const formatCurrency = (amount: number) => {
    return formatAmount(amount, currency)
  }

  const chartData = useMemo(() => {
    const data = viewMode === 'monthly' ? monthlyData : dailyData
    if (!data) return []

    return data.map(item => ({
      ...item,
      amount: Math.round(item.amount * 100) / 100
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

  // const handleCloseTransactions = () => {
  //   setSelectedDate(null)
  // }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-80'>
        <div className='text-muted-foreground'>{t('common.loading')}</div>
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className='flex items-center justify-center h-80'>
        <div className='text-muted-foreground'>
          {t('analytics.noDataForMonth')}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* View Mode Toggle */}
      <div className='flex items-center gap-2'>
        <Button
          variant={viewMode === 'monthly' ? 'default' : 'outline'}
          size='sm'
          onClick={() => setViewMode('monthly')}
        >
          <BarChart3 className='w-4 h-4 mr-2' />
          {t('analytics.monthlyTrend')}
        </Button>
        <Button
          variant={viewMode === 'daily' ? 'default' : 'outline'}
          size='sm'
          onClick={() => setViewMode('daily')}
        >
          <Calendar className='w-4 h-4 mr-2' />
          {t('analytics.dailyTrend')}
        </Button>
      </div>

      {/* Chart */}
      <Card>
        <CardContent className='p-6'>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={chartData}
                onClick={handleChartClick}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='label'
                  tick={{ fontSize: 12 }}
                  angle={viewMode === 'daily' ? -45 : 0}
                  textAnchor={viewMode === 'daily' ? 'end' : 'middle'}
                  height={viewMode === 'daily' ? 60 : 30}
                />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelFormatter={label => {
                    if (viewMode === 'daily') {
                      return new Date(label).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric'
                      })
                    }
                    return label
                  }}
                />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='amount'
                  stroke={categoryId ? '#3B82F6' : '#10B981'}
                  strokeWidth={2}
                  dot={{
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
        </CardContent>
      </Card>

      {selectedDate && dateTransactions && (
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-lg'>
                {t('analytics.transactionsFor')}{' '}
                {viewMode === 'monthly'
                  ? new Date(selectedDate + '-01').toLocaleDateString('en', {
                      month: 'long',
                      year: 'numeric'
                    })
                  : new Date(selectedDate).toLocaleDateString('en', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
              </CardTitle>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSelectedDate(null)}
              >
                <X className='w-4 h-4' />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className='text-center py-4'>
                {t('analytics.loadingTransactions')}
              </div>
            ) : dateTransactions.length > 0 ? (
              <div className='space-y-3 max-h-64 overflow-y-auto'>
                {dateTransactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium truncate'>
                        {transaction.description ||
                          t('transactions.noDescription')}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        {new Date(transaction.date).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='font-semibold text-red-600'>
                        {formatCurrency(transaction.amount)}
                      </div>
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
