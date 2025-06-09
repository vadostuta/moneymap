'use client'

import { RecentTransactionItem } from '@/components/transaction/RecentTransactionItem'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { transactionService } from '@/lib/services/transaction'
import { useInfiniteQuery } from '@tanstack/react-query'
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'

export default function TransactionsPage () {
  const { user, loading: authLoading } = useAuth()
  const ITEMS_PER_PAGE = 10
  const [searchQuery, setSearchQuery] = useState('')

  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['list-transactions', searchQuery],
      queryFn: async ({ pageParam = 0 }) => {
        if (!user) return []
        const offset = pageParam * ITEMS_PER_PAGE
        return await transactionService.getFilteredTransactions({
          userId: user.id,
          offset,
          limit: ITEMS_PER_PAGE,
          searchQuery: searchQuery || undefined
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

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div className='container px-4 py-4 sm:py-6 mx-auto max-w-7xl'>
      <div className='mb-4'>
        <Input
          type='search'
          placeholder='Search transactions...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='max-w-sm'
        />
      </div>

      <div className='space-y-4'>
        {data?.pages?.flat().length === 0 ? (
          <div>No transactions found</div>
        ) : (
          data?.pages
            ?.flat()
            .map(transaction => (
              <RecentTransactionItem
                key={transaction.id}
                transaction={transaction}
              />
            ))
        )}

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
    </div>
  )
}
