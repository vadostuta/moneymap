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
import { usePrivacy } from '@/contexts/privacy-context'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface MonthlyExpenseChartProps {
  month: Date
  walletId: string
  showWalletName?: boolean
}

export function MonthlyExpenseChart ({
  month,
  walletId,
  showWalletName = false
}: MonthlyExpenseChartProps) {
  const { t } = useTranslation('common')
  const { formatAmount } = usePrivacy()
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [type, setType] = useState<'net' | 'expense' | 'income'>('net') // Default to 'net'

  // Fetch wallet info for currency
  const { data: wallet } = useQuery({
    queryKey: ['wallet', walletId],
    queryFn: () => walletService.getById(walletId),
    enabled: !!walletId
  })

  // Fetch data for the selected month based on type
  const {
    data: data,
    isLoading,
    error
  } = useQuery({
    queryKey: [
      'monthly-data',
      walletId,
      month.getFullYear(),
      month.getMonth(),
      type
    ],
    queryFn: async () => {
      if (type === 'net') {
        return await transactionService.getMonthlyNetByCategory(
          walletId,
          month.getFullYear(),
          month.getMonth()
        )
      } else if (type === 'expense') {
        return await transactionService.getMonthlyExpensesByCategory(
          walletId,
          month.getFullYear(),
          month.getMonth()
        )
      } else {
        return await transactionService.getCurrentMonthIncomeByCategory(
          walletId
        )
      }
    },
    enabled: !!walletId && !!month
  })

  const formatMonthYear = (date: Date) => {
    return new Intl.DateTimeFormat('en', {
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  const totalAmount = data?.reduce((sum, item) => sum + item.amount, 0) || 0

  const formatCurrency = (amount: number) => {
    const currency = wallet?.currency || 'UAH'
    return formatAmount(amount, currency)
  }

  // Don't render if no data and we're showing wallet names (for "All wallets" mode)
  if (showWalletName && (!data || data.length === 0)) {
    return null
  }

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>
                {showWalletName && wallet
                  ? wallet.name
                  : formatMonthYear(month)}
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
                {showWalletName && wallet
                  ? wallet.name
                  : formatMonthYear(month)}
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

  if (!data || data.length === 0) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>
                {showWalletName && wallet
                  ? wallet.name
                  : formatMonthYear(month)}
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
        {/* Header with Month, Total and Type Switcher */}
        <div className='space-y-4'>
          {showWalletName && wallet && (
            <div className='text-lg font-semibold text-foreground'>
              {wallet.name}
            </div>
          )}
          <div className='flex flex-col md:flex-row items-start justify-between gap-4'>
            <div className='space-y-2'>
              <div className='text-2xl font-medium text-muted-foreground'>
                {formatMonthYear(month)}
              </div>
              <div className='text-3xl font-bold text-foreground'>
                {formatCurrency(totalAmount)}
              </div>
            </div>

            {/* Type Switcher */}
            <div className='flex flex-col items-end'>
              <Tabs
                value={type}
                onValueChange={value =>
                  setType(value as 'net' | 'expense' | 'income')
                }
                className='w-full md:w-auto'
              >
                <TabsList>
                  <TabsTrigger value='net'>{t('overview.net')}</TabsTrigger>
                  <TabsTrigger value='expense'>
                    {t('overview.expenses')}
                  </TabsTrigger>
                  <TabsTrigger value='income'>
                    {t('overview.income')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <MonthlyExpenseBarChart
          data={data}
          currency={wallet?.currency || 'UAH'}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
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
