'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { transactionService } from '@/lib/services/transaction'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import { RecentTransactionItem } from './RecentTransactionItem'
import { TransactionCategory } from '@/lib/types/transaction'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from 'react-i18next'
import { UndoDeleteToast } from '@/components/ui/undo-delete-toast'

interface RecentTransactionsProps {
  selectedCategory?: TransactionCategory
  onResetCategory?: () => void
  selectedWalletId?: string
}

export function RecentTransactions ({
  selectedCategory,
  onResetCategory,
  selectedWalletId
}: RecentTransactionsProps) {
  const { t } = useTranslation('common')
  const { user, loading: authLoading } = useAuth()
  const ITEMS_PER_PAGE = 10
  const [deletedTransaction, setDeletedTransaction] = useState<{
    id: string
    onUndo: () => void
  } | null>(null)

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['recent-transactions', selectedCategory],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user) return []
      const offset = pageParam * ITEMS_PER_PAGE
      return await transactionService.getFilteredTransactions({
        userId: user.id,
        offset,
        limit: ITEMS_PER_PAGE,
        category: selectedCategory
      })
    },
    enabled: !!user && !authLoading,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length === 0) {
        return undefined
      }
      return lastPage.length === ITEMS_PER_PAGE ? allPages.length : undefined
    },
    initialPageParam: 0
  })

  // Use a Set to ensure unique transactions
  const transactions = React.useMemo(() => {
    const seen = new Set()
    return (
      data?.pages?.flat().filter(transaction => {
        if (seen.has(transaction.id) || transaction.is_hidden) {
          return false
        }
        seen.add(transaction.id)
        return true
      }) ?? []
    )
  }, [data?.pages])

  const handleTransactionDelete = (
    transactionId: string,
    onUndo: () => void
  ) => {
    setDeletedTransaction({ id: transactionId, onUndo })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>{t('transactions.recentTransactions')}</CardTitle>
          {selectedCategory && onResetCategory && (
            <Button variant='ghost' size='sm' onClick={onResetCategory}>
              {t('common.resetFilter')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p>{t('common.loading')}</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>{t('transactions.recentTransactions')}</CardTitle>
          {selectedCategory && onResetCategory && (
            <Button variant='ghost' size='sm' onClick={onResetCategory}>
              {t('common.resetFilter')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p>{t('common.error')}</p>
        </CardContent>
      </Card>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>{t('transactions.recentTransactions')}</CardTitle>
          {selectedCategory && onResetCategory && (
            <Button variant='ghost' size='sm' onClick={onResetCategory}>
              {t('common.resetFilter')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p>{t('transactions.noTransactions')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>{t('transactions.recentTransactions')}</CardTitle>
        {selectedCategory && onResetCategory && (
          <Button variant='ghost' size='sm' onClick={onResetCategory}>
            {t('common.resetFilter')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {transactions.map(transaction => (
            <RecentTransactionItem
              key={transaction.id}
              transaction={transaction}
              activeWalletId={selectedWalletId}
              onDelete={handleTransactionDelete}
            />
          ))}

          {hasNextPage && (
            <div className='flex justify-center pt-4'>
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant='outline'
                className='w-full'
              >
                {isFetchingNextPage
                  ? t('common.loading')
                  : t('common.showMore')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {deletedTransaction && (
        <UndoDeleteToast
          onUndo={deletedTransaction.onUndo}
          onClose={() => setDeletedTransaction(null)}
        />
      )}
    </Card>
  )
}
