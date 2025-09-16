'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { transactionService } from '@/lib/services/transaction'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getTranslatedCategoryName } from '@/lib/categories-translations-mapper'
import { categoryService } from '@/lib/services/category'
import { useAuth } from '@/contexts/auth-context'
import { usePrivacy } from '@/contexts/privacy-context'

interface RecentTransactionsListProps {
  walletId: string
  month: Date
  selectedCategory?: string
  currency: string
}

export function RecentTransactionsList ({
  walletId,
  month,
  selectedCategory,
  currency
}: RecentTransactionsListProps) {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const { formatAmount } = usePrivacy()

  // Fetch categories for names
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories
  })

  // Calculate date range for the month
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)

  // Fetch filtered transactions for the month using the efficient service method
  const { data: transactions, isLoading } = useQuery({
    queryKey: [
      'recent-transactions',
      walletId,
      month.getFullYear(),
      month.getMonth(),
      selectedCategory
    ],
    queryFn: async () => {
      if (!user) return []

      // Use the efficient getFilteredTransactions method
      const filteredTransactions =
        await transactionService.getFilteredTransactions({
          userId: user.id,
          walletId: walletId,
          category: selectedCategory,
          fromDate: startOfMonth,
          toDate: endOfMonth,
          limit: 10, // Limit to 10 most recent transactions
          showHidden: false
        })

      // Filter to only show expenses (since this is for expense analytics)
      return filteredTransactions.filter(t => t.type === 'expense')
    },
    enabled: !!user && !!walletId && !!month
  })

  const formatCurrency = (amount: number) => {
    return formatAmount(amount, currency)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short'
    }).format(new Date(dateString))
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? getTranslatedCategoryName(category.name, t) : 'Unknown'
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.icon || '📌'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>
            {selectedCategory
              ? t('analytics.categoryTransactions')
              : t('analytics.recentTransactions')}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='flex items-center gap-3'>
              <Skeleton className='h-4 w-4 rounded-full' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-3 w-16' />
              </div>
              <Skeleton className='h-4 w-20' />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>
            {selectedCategory
              ? t('analytics.categoryTransactions')
              : t('analytics.recentTransactions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-center py-4'>
            {selectedCategory
              ? t('analytics.noTransactionsForCategory')
              : t('analytics.noTransactionsForMonth')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='h-full flex flex-col'>
      <CardHeader className='flex-shrink-0'>
        <CardTitle className='text-lg'>
          {selectedCategory
            ? t('analytics.categoryTransactions')
            : t('analytics.recentTransactions')}
        </CardTitle>
        {selectedCategory && (
          <p className='text-sm text-muted-foreground'>
            {t('analytics.showingCategoryTransactions', {
              category: getCategoryName(selectedCategory)
            })}
          </p>
        )}
      </CardHeader>
      <CardContent className='flex-1 overflow-y-auto max-h-96 space-y-3'>
        {transactions.map(transaction => (
          <div
            key={transaction.id}
            className='flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors'
          >
            <div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm'>
              {getCategoryIcon(transaction.category_id || '')}
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-sm font-medium truncate'>
                {transaction.description || t('transactions.noDescription')}
              </div>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <span>{formatDate(transaction.date)}</span>
                <span>•</span>
                <span>{getCategoryName(transaction.category_id || '')}</span>
              </div>
            </div>
            <Badge variant='secondary' className='text-xs'>
              {formatCurrency(transaction.amount)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
