import { format } from 'date-fns'
import {
  Transaction,
  TransactionCategory,
  TransactionType
} from '@/lib/types/transaction'
import {
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  ChevronDown,
  Trash2,
  Wallet
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { transactionService } from '@/lib/services/transaction'
import { toastService } from '@/lib/services/toast'
import { Button } from '@/components/ui/button'
import { categoryService } from '@/lib/services/category'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { getTranslatedCategoryName } from '@/lib/categories-translations-mapper'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

function hexToRgba (hex: string, alpha: number) {
  let c = hex.replace('#', '')
  if (c.length === 3)
    c = c
      .split('')
      .map(x => x + x)
      .join('')
  const num = parseInt(c, 16)
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${
    num & 255
  }, ${alpha})`
}

export function RecentTransactionItem ({
  transaction,
  activeWalletId,
  onDelete
}: {
  transaction: Transaction
  activeWalletId?: string
  onDelete: (id: string, onUndo: () => void) => void
}) {
  const { t } = useTranslation('common')
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const router = useRouter()

  // Add categories query
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      await transactionService.update(transaction.id, {
        category_id: categoryId
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] })
      toastService.success(t('transactions.categoryUpdateSuccess'))
    },
    onError: () => {
      toastService.error(t('transactions.categoryUpdateError'))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await transactionService.delete(transaction.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] })

      onDelete(transaction.id, () => {
        restoreMutation.mutate()
      })
    },
    onError: () => {
      toastService.error(t('transactions.deleteError'))
    }
  })

  const restoreMutation = useMutation({
    mutationFn: async () => {
      await transactionService.restore(transaction.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] })
      toastService.success(t('transactions.restoreSuccess'))
    },
    onError: () => {
      toastService.error(t('transactions.restoreError'))
    }
  })

  const updateTypeMutation = useMutation({
    mutationFn: async (newType: TransactionType) => {
      await transactionService.update(transaction.id, {
        type: newType
      })
    },
    onSuccess: () => {
      if (pathname === '/overview') {
        queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
        queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] })
      } else if (pathname === '/transactions') {
        queryClient.invalidateQueries({ queryKey: ['list-transactions'] })
      }
      toastService.success(t('transactions.typeUpdateSuccess'))
    },
    onError: () => {
      toastService.error(t('transactions.typeUpdateError'))
    }
  })

  const cycleTransactionType = () => {
    const types: TransactionType[] = ['expense', 'income', 'transfer']
    const currentIndex = types.indexOf(transaction.type)
    const nextIndex = (currentIndex + 1) % types.length
    updateTypeMutation.mutate(types[nextIndex])
  }

  const handleCategoryChange = (newCategory: TransactionCategory) => {
    // Find the category in our list to get the category ID
    const category = categories.find(cat => cat.name === newCategory)
    if (category) {
      // Use the category ID for the update
      updateCategoryMutation.mutate(category.id)
    } else {
      // Fallback to the original category if not found
      updateCategoryMutation.mutate(newCategory)
    }
  }

  // Find the current category from the fetched categories
  const currentCategory = categories.find(
    cat => cat.id === transaction.category_id
  )

  return (
    <>
      <div className='flex flex-col sm:flex-row sm:items-start justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/5 transition-colors gap-3 min-w-0'>
        <div className='flex flex-col gap-2 min-w-0'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0'>
            <div className='flex-1 min-w-0 max-w-full'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className='text-base sm:text-lg font-semibold truncate block w-full overflow-hidden text-ellipsis whitespace-nowrap'
                      title={transaction.description}
                      tabIndex={0}
                    >
                      {transaction.description}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='max-w-xs break-words'>
                      {transaction.description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground'>
            {transaction.type !== 'transfer' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity'
                    type='button'
                    style={{
                      backgroundColor: currentCategory?.color_bg?.includes('#')
                        ? hexToRgba(currentCategory.color_bg, 0.15)
                        : currentCategory?.color_bg || '#374151'
                    }}
                  >
                    <span
                      style={{ color: '#fff' }}
                      className='flex items-center'
                    >
                      {currentCategory?.icon || '📌'}
                    </span>
                    <span
                      className='hidden sm:inline'
                      style={{ color: '#fff' }}
                    >
                      {getTranslatedCategoryName(
                        currentCategory?.name ?? '',
                        t
                      )}
                    </span>
                    <span className='sm:hidden' style={{ color: '#fff' }}>
                      {
                        getTranslatedCategoryName(
                          currentCategory?.name ?? '',
                          t
                        ).split(' ')[0]
                      }
                    </span>
                    <ChevronDown
                      className='w-3 h-3 ml-1'
                      style={{ color: '#fff' }}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='w-48'>
                  {categories
                    .filter(category => category.is_active)
                    .map(category => {
                      const isSelected = category.id === transaction.category_id
                      return (
                        <DropdownMenuItem
                          key={category.id}
                          onClick={() =>
                            handleCategoryChange(
                              category.name as TransactionCategory
                            )
                          }
                          className={`flex items-center gap-2 rounded-md`}
                          style={{
                            backgroundColor: isSelected
                              ? category.color_bg?.includes('#')
                                ? hexToRgba(category.color_bg, 0.15)
                                : undefined
                              : undefined
                          }}
                        >
                          <span style={{ color: '#fff' }}>{category.icon}</span>
                          <span style={{ color: '#fff' }}>
                            {getTranslatedCategoryName(category.name, t)}
                          </span>
                        </DropdownMenuItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {transaction.type === 'transfer' && (
              <span className='hidden sm:inline'>•</span>
            )}
            <div className='flex items-center gap-1'>
              <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
        <div className='flex flex-col items-start sm:items-end gap-1 w-full sm:w-auto'>
          <span
            className='text-xs sm:text-sm text-muted-foreground flex items-center gap-1 cursor-pointer hover:underline'
            onClick={() => {
              if (transaction.wallet?.id) {
                router.push(`/wallets/${transaction.wallet.id}`)
              }
            }}
            title='Go to wallet'
            tabIndex={0}
            role='button'
            onKeyDown={e => {
              if (e.key === 'Enter' && transaction.wallet?.id) {
                router.push(`/wallets/${transaction.wallet.id}`)
              }
            }}
          >
            <Wallet
              className={`w-3 h-3 sm:w-4 sm:h-4 ${
                activeWalletId === transaction.wallet?.id
                  ? 'text-yellow-500 dark:text-yellow-400'
                  : ''
              }`}
            />
            {transaction.wallet?.name}
          </span>
          <div className='flex items-center gap-2'>
            <div
              className={`flex items-center gap-1 text-base sm:text-lg font-semibold ${
                transaction.type === 'expense'
                  ? 'text-white'
                  : 'text-emerald-500'
              }`}
            >
              <button
                onClick={cycleTransactionType}
                disabled={updateTypeMutation.isPending}
                className='flex items-center gap-1 hover:opacity-80 transition-opacity'
              >
                {transaction.type === 'expense' ? (
                  <ArrowDown className='w-4 h-4 sm:w-5 sm:h-5' />
                ) : transaction.type === 'income' ? (
                  <ArrowUp className='w-4 h-4 sm:w-5 sm:h-5' />
                ) : (
                  <ArrowRightLeft className='w-4 h-4 sm:w-5 sm:h-5' />
                )}
              </button>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: transaction.wallet?.currency || 'USD'
              }).format(transaction.amount)}
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive'
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
