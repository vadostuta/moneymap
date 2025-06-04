'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { transactionService } from '@/lib/services/transaction'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import React from 'react'
import { RecentTransactionItem } from './RecentTransactionItem'

export function RecentTransactions () {
  const ITEMS_PER_PAGE = 10

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['recent-transactions'],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam * ITEMS_PER_PAGE
      return await transactionService.getRecentTransactions(
        offset,
        ITEMS_PER_PAGE
      )
    },
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
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
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
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
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
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No transactions found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
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
