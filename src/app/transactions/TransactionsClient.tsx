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
import { EyeOff, EyeIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { UndoDeleteToast } from '@/components/ui/undo-delete-toast'

export default function TransactionsClient () {
  const { t } = useTranslation('common')
  const { user, loading: authLoading } = useAuth()
  const ITEMS_PER_PAGE = 10
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [selectedWalletId, setSelectedWalletId] = useState<string | 'all'>(
    'all'
  )
  const [showHidden, setShowHidden] = useState(false)
  const [deletedTransaction, setDeletedTransaction] = useState<{
    id: string
    onUndo: () => void
  } | null>(null)
  const [minAmount, setMinAmount] = useState<string>('')
  const [maxAmount, setMaxAmount] = useState<string>('')

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
        selectedWalletId,
        showHidden,
        minAmount,
        maxAmount
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
          walletId: selectedWalletId,
          showHidden,
          minAmount: minAmount ? parseFloat(minAmount) : undefined,
          maxAmount: maxAmount ? parseFloat(maxAmount) : undefined
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

  const handleTransactionDelete = (
    transactionId: string,
    onUndo: () => void
  ) => {
    setDeletedTransaction({ id: transactionId, onUndo })
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div
      className='container px-3 sm:px-4 md:px-6 ml-0 sm:ml-10 max-w-7xl'
      style={{ minWidth: 'calc(100% - 5vw)' }}
    >
      <div className='space-y-4 mb-6'>
        <div className='flex flex-wrap gap-4 items-center'>
          <Input
            type='search'
            placeholder={t('transactions.search')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='max-w-sm'
          />

          <div className='flex gap-2 items-center'>
            <Input
              type='number'
              placeholder={t('transactions.minAmount', 'Min amount')}
              value={minAmount}
              onChange={e => setMinAmount(e.target.value)}
              className='w-[120px]'
            />
            <span>-</span>
            <Input
              type='number'
              placeholder={t('transactions.maxAmount', 'Max amount')}
              value={maxAmount}
              onChange={e => setMaxAmount(e.target.value)}
              className='w-[120px]'
            />
          </div>

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

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type='button'
                  onClick={() => setShowHidden(v => !v)}
                  className='ml-2 p-2 rounded-full bg-transparent text-muted-foreground hover:text-yellow-500 transition-colors'
                  aria-label={
                    showHidden
                      ? t('transactions.hideHidden', 'Hide hidden transactions')
                      : t('transactions.showHidden', 'Show hidden transactions')
                  }
                >
                  {showHidden ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <EyeIcon className='w-5 h-5' />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {showHidden
                  ? t(
                      'transactions.hideHiddenTooltip',
                      'Hide hidden transactions from the list'
                    )
                  : t(
                      'transactions.showHiddenTooltip',
                      'Include hidden transactions in the list'
                    )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                onDelete={handleTransactionDelete}
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

      {deletedTransaction && (
        <UndoDeleteToast
          onUndo={deletedTransaction.onUndo}
          onClose={() => setDeletedTransaction(null)}
        />
      )}
    </div>
  )
}
