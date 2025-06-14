'use client'

import { walletService } from '@/lib/services/wallet'
import { transactionService } from '@/lib/services/transaction'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TransactionItem } from '@/components/transaction/TransactionItem'
import { toastService } from '@/lib/services/toast'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { RecentTransactionItem } from '../transaction/RecentTransactionItem'

interface WalletDetailProps {
  walletId: string
  onDelete: () => void
}

export function WalletDetail ({ walletId, onDelete }: WalletDetailProps) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    data: wallet,
    isLoading: isWalletLoading,
    isError: isWalletError
  } = useQuery({
    queryKey: ['wallet', walletId],
    queryFn: () => walletService.getById(walletId)
  })

  const {
    data: recentTransactions = [],
    isLoading: isTransactionsLoading,
    isError: isTransactionsError
  } = useQuery({
    queryKey: ['recent-transactions', walletId],
    queryFn: async () => {
      const txs = await transactionService.getByWalletId(walletId)
      return txs.slice(0, 10)
    }
  })

  const deleteWalletMutation = useMutation({
    mutationFn: async () => {
      await walletService.delete(walletId)
    },
    onSuccess: () => {
      toastService.success(t('wallets.detail.deleteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      onDelete()
    },
    onError: error => {
      if (error instanceof Error) {
        toastService.error(error.message)
      } else {
        toastService.error(t('wallets.detail.deleteError'))
      }
      console.error('Error deleting wallet:', error)
    }
  })

  const handleDelete = () => {
    if (!confirm(t('wallets.detail.deleteConfirm'))) return
    deleteWalletMutation.mutate()
  }

  const setPrimaryMutation = useMutation({
    mutationFn: async () => {
      await walletService.setPrimary(walletId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
    onError: error => {
      console.error('Failed to set primary wallet:', error)
    }
  })

  const handlePrimaryToggle = () => {
    setPrimaryMutation.mutate()
  }

  if (isWalletLoading) return <div>{t('wallets.detail.loading')}</div>
  if (isWalletError || !wallet) return <div>{t('wallets.detail.notFound')}</div>

  return (
    <div className='p-3 sm:p-4 md:p-6'>
      <div className='flex items-center justify-between mb-3 sm:mb-4'>
        <h2 className='text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 truncate pr-2'>
          {wallet.name}
        </h2>
        <div className='flex items-center gap-1.5 sm:gap-2 flex-shrink-0'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.push(`/wallets/${wallet.id}/edit`)}
            className='h-8 sm:h-9'
          >
            {t('wallets.detail.edit')}
          </Button>
          <button
            onClick={handlePrimaryToggle}
            className='p-1.5 sm:p-2 hover:bg-secondary rounded-full'
          >
            <Star
              className={cn(
                'h-4 w-4 sm:h-5 sm:w-5',
                wallet.is_primary
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              )}
            />
          </button>
        </div>
      </div>

      <div className='mb-3 sm:mb-4 md:mb-6'>
        <p className='text-gray-600 text-xs sm:text-sm md:text-base'>
          {t('wallets.detail.type')}: {wallet.type}
        </p>
      </div>

      <div className='mb-3 sm:mb-4 md:mb-6'>
        <p className='text-xs sm:text-sm text-gray-500'>
          {t('wallets.detail.created')}:{' '}
          {new Date(wallet.created_at).toLocaleDateString()}
        </p>
        <p className='text-xs sm:text-sm text-gray-500'>
          {t('wallets.detail.lastUpdated')}:{' '}
          {new Date(wallet.updated_at).toLocaleDateString()}
        </p>
      </div>

      <div className='flex gap-3 sm:gap-4 flex-col sm:flex-row mb-4 sm:mb-6'>
        <Button
          variant='destructive'
          onClick={handleDelete}
          className='w-full sm:w-auto h-9 sm:h-10'
          disabled={deleteWalletMutation.isPending}
        >
          {deleteWalletMutation.isPending
            ? t('wallets.detail.deleting')
            : t('wallets.detail.deleteWallet')}
        </Button>
      </div>

      <div className='mb-3 sm:mb-4 md:mb-6'>
        <h3 className='text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 md:mb-4'>
          {t('wallets.detail.recentTransactions')}
        </h3>
        {isTransactionsLoading ? (
          <p className='text-sm sm:text-base'>
            {t('wallets.detail.loadingTransactions')}
          </p>
        ) : isTransactionsError ? (
          <p className='text-sm sm:text-base text-red-500'>
            {t('wallets.detail.loadError')}
          </p>
        ) : recentTransactions.length > 0 ? (
          <div className='space-y-2 sm:space-y-3'>
            {recentTransactions.map(transaction => (
              // <TransactionItem
              //   key={transaction.id}
              //   transaction={transaction}
              //   showActions={false}
              // />
              <RecentTransactionItem
                key={transaction.id}
                transaction={transaction}
              />
            ))}
          </div>
        ) : (
          <p className='text-sm sm:text-base text-gray-500'>
            {t('wallets.detail.noTransactions')}
          </p>
        )}
      </div>
    </div>
  )
}
