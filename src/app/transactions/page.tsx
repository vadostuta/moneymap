'use client'

import { RecentTransactionItem } from '@/components/transaction/RecentTransactionItem'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { transactionService } from '@/lib/services/transaction'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { categoryService } from '@/lib/services/category'
import { TransactionCategory } from '@/lib/types/transaction'

export default function TransactionsPage () {
  const { user, loading: authLoading } = useAuth()
  const ITEMS_PER_PAGE = 10
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] =
    useState<TransactionCategory>()

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories
  })

  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['list-transactions', searchQuery, selectedCategory],
      queryFn: async ({ pageParam = 0 }) => {
        if (!user) return []
        const offset = pageParam * ITEMS_PER_PAGE
        return await transactionService.getFilteredTransactions({
          userId: user.id,
          offset,
          limit: ITEMS_PER_PAGE,
          searchQuery: searchQuery || undefined,
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

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div className='container px-4 py-4 sm:py-6 mx-auto max-w-7xl'>
      <div className='space-y-4 mb-6'>
        <Input
          type='search'
          placeholder='Search transactions...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='max-w-sm'
        />

        <div className='flex flex-wrap gap-2'>
          {categories
            .filter(category => category.is_active)
            .map(category => (
              <button
                key={category.id}
                type='button'
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.name
                      ? undefined
                      : category.name
                  )
                }
                className={cn(
                  'transition-all duration-200 ease-in-out',
                  selectedCategory === category.name ? 'scale-102' : ''
                )}
              >
                <Badge
                  variant={
                    selectedCategory === category.name
                      ? 'selected'
                      : 'secondary'
                  }
                  className={cn(
                    'w-full py-1.5 text-sm cursor-pointer hover:opacity-90 flex items-center justify-center',
                    selectedCategory === category.name ? 'shadow-sm' : ''
                  )}
                >
                  <span className={cn('mr-1.5', category.color_text)}>
                    {category.icon}
                  </span>
                  <span className='truncate'>{category.name}</span>
                </Badge>
              </button>
            ))}
        </div>
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
