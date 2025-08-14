'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { transactionService } from '@/lib/services/transaction'
import { walletService } from '@/lib/services/wallet'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MonthlyExpenseBarChart } from './MonthlyExpenseBarChart'
import { Skeleton } from '@/components/ui/skeleton'
import { RecentTransactionsList } from './RecentTransactionsList'

interface MonthlyExpenseChartProps {
  month: Date
  walletId: string
}

export function MonthlyExpenseChart ({
  month,
  walletId
}: MonthlyExpenseChartProps) {
  const { t } = useTranslation('common')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()

  // Fetch wallet info for currency
  const { data: wallet } = useQuery({
    queryKey: ['wallet', walletId],
    queryFn: () => walletService.getById(walletId),
    enabled: !!walletId
  })

  // Fetch expenses for the selected month
  const {
    data: expenses,
    isLoading,
    error
  } = useQuery({
    queryKey: [
      'monthly-expenses',
      walletId,
      month.getFullYear(),
      month.getMonth()
    ],
    queryFn: () =>
      transactionService.getMonthlyExpensesByCategory(
        walletId,
        month.getFullYear(),
        month.getMonth()
      ),
    enabled: !!walletId && !!month
  })

  const formatMonthYear = (date: Date) => {
    return new Intl.DateTimeFormat('en', {
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  const totalExpenses =
    expenses?.reduce((sum, item) => sum + item.amount, 0) || 0

  const formatCurrency = (amount: number) => {
    const currency = wallet?.currency || 'UAH'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>
                {formatMonthYear(month)}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-64 w-full' />
            </CardContent>
          </Card>
        </div>
        <div className='space-y-6'>
          <Skeleton className='h-64 w-full' />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>
                {formatMonthYear(month)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-destructive'>{t('common.error')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>
                {formatMonthYear(month)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                {t('analytics.noDataForMonth', {
                  month: formatMonthYear(month)
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      {/* Left Side - Charts */}
      <div className='lg:col-span-2 space-y-6'>
        {/* Header with Month and Total */}
        <Card>
          <CardHeader>
            <CardTitle className='text-2xl'>{formatMonthYear(month)}</CardTitle>
            <div className='text-3xl font-bold text-foreground'>
              {formatCurrency(totalExpenses)}
            </div>
          </CardHeader>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>
              {t('analytics.expensesByCategory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyExpenseBarChart
              data={expenses}
              currency={wallet?.currency || 'UAH'}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          </CardContent>
        </Card>

        {/* Pie Chart */}
        {/* <Card>
          <CardHeader>
            <CardTitle className='text-lg'>
              {t('analytics.categoryBreakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyExpensePieChart
              data={expenses}
              currency={wallet?.currency || 'UAH'}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          </CardContent>
        </Card> */}
      </div>

      {/* Right Side - Transaction List */}
      <div className='space-y-6'>
        <RecentTransactionsList
          walletId={walletId}
          month={month}
          selectedCategory={selectedCategory}
          currency={wallet?.currency || 'UAH'}
        />
      </div>
    </div>
  )
}
