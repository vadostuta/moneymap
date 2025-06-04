'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { transactionService } from '@/lib/services/transaction'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import React from 'react'
import { RecentTransactionItem } from './RecentTransactionItem'
import { TransactionCategory } from '@/lib/types/transaction'
import { useAuth } from '@/contexts/auth-context'

interface RecentTransactionsProps {
  selectedCategory?: TransactionCategory
  onResetCategory?: () => void
}

export function RecentTransactions ({
  selectedCategory,
  onResetCategory
}: RecentTransactionsProps) {
  const { user, loading: authLoading } = useAuth()
  const ITEMS_PER_PAGE = 10

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
        if (seen.has(transaction.id)) {
          return false
        }
        seen.add(transaction.id)
        return true
      }) ?? []
    )
  }, [data?.pages])

  if (isLoading) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Recent Transactions</CardTitle>
          {selectedCategory && onResetCategory && (
            <Button variant='ghost' size='sm' onClick={onResetCategory}>
              Reset Filter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p>Loading transactions...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Recent Transactions</CardTitle>
          {selectedCategory && onResetCategory && (
            <Button variant='ghost' size='sm' onClick={onResetCategory}>
              Reset Filter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p>Error loading transactions</p>
        </CardContent>
      </Card>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Recent Transactions</CardTitle>
          {selectedCategory && onResetCategory && (
            <Button variant='ghost' size='sm' onClick={onResetCategory}>
              Reset Filter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p>No transactions found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>Recent Transactions</CardTitle>
        {selectedCategory && onResetCategory && (
          <Button variant='ghost' size='sm' onClick={onResetCategory}>
            Reset Filter
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {transactions.map(transaction => (
            <RecentTransactionItem
              key={transaction.id}
              transaction={transaction}
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
                {isFetchingNextPage ? 'Loading...' : 'Show More'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
