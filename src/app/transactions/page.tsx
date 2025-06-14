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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'
import { getTranslatedCategoryName } from '@/lib/categories-translations-mapper'

export default function TransactionsPage () {
  const { t } = useTranslation('common')
  const { user, loading: authLoading } = useAuth()
  const ITEMS_PER_PAGE = 10
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [selectedWalletId, setSelectedWalletId] = useState<string | 'all'>(
    'all'
  )

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories
  })

  // Fetch wallets
  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      if (!user) return []
      return await transactionService.fetchWallets(user.id)
    },
    enabled: !!user && !authLoading
  })

  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        'list-transactions',
        searchQuery,
        selectedCategory,
        selectedWalletId
      ],
      queryFn: async ({ pageParam = 0 }) => {
        if (!user) return []
        const offset = pageParam * ITEMS_PER_PAGE
        return await transactionService.getFilteredTransactions({
          userId: user.id,
          offset,
          limit: ITEMS_PER_PAGE,
          searchQuery: searchQuery || undefined,
          category: selectedCategory,
          walletId: selectedWalletId
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
        <div className='flex flex-wrap gap-4 items-center'>
          <Input
            type='search'
            placeholder={t('transactions.search')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='max-w-sm'
          />

          <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
            <SelectTrigger className='w-full sm:w-[200px]'>
              <SelectValue placeholder={t('wallets.selectWallet')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{t('wallets.allWallets')}</SelectItem>
              {wallets.map(wallet => (
                <SelectItem key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-wrap gap-2'>
          {categories
            .filter(category => category.is_active)
            .map(category => (
              <button
                key={category.id}
                type='button'
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? undefined : category.id
                  )
                }
                className={cn(
                  'transition-all duration-200 ease-in-out',
                  selectedCategory === category.id ? 'scale-102' : ''
                )}
              >
                <Badge
                  variant={
                    selectedCategory === category.id ? 'selected' : 'secondary'
                  }
                  className={cn(
                    'w-full py-1.5 text-sm cursor-pointer hover:opacity-90 flex items-center justify-center',
                    selectedCategory === category.id ? 'shadow-sm' : ''
                  )}
                >
                  <span className={cn('mr-1.5', category.color_text)}>
                    {category.icon}
                  </span>
                  <span className='truncate'>
                    {getTranslatedCategoryName(category.name, t)}
                  </span>
                </Badge>
              </button>
            ))}
        </div>
      </div>

      <div className='space-y-4'>
        {data?.pages?.flat().length === 0 ? (
          <div>{t('transactions.noTransactions')}</div>
        ) : (
          data?.pages
            ?.flat()
            .map(transaction => (
              <RecentTransactionItem
                key={transaction.id}
                transaction={transaction}
                activeWalletId={
                  selectedWalletId === 'all' ? undefined : selectedWalletId
                }
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
              {isFetchingNextPage ? t('common.loading') : t('common.showMore')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
