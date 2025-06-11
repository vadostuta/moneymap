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

interface WalletDetailProps {
  walletId: string
  onDelete: () => void
}

export function WalletDetail ({ walletId, onDelete }: WalletDetailProps) {
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
      toastService.success('Wallet deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      onDelete()
    },
    onError: error => {
      if (error instanceof Error) {
        toastService.error(error.message)
      } else {
        toastService.error('Failed to delete wallet')
      }
      console.error('Error deleting wallet:', error)
    }
  })

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this wallet?')) return
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

  if (isWalletLoading) return <div>Loading...</div>
  if (isWalletError || !wallet) return <div>Wallet not found</div>

  return (
    <div className='p-4 md:p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl md:text-2xl font-bold mb-2'>{wallet.name}</h2>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={() => router.push(`/wallets/${wallet.id}/edit`)}
          >
            Edit
          </Button>
          <button
            onClick={handlePrimaryToggle}
            className='p-2 hover:bg-secondary rounded-full'
          >
            <Star
              className={cn(
                'h-5 w-5',
                wallet.is_primary
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              )}
            />
          </button>
        </div>
      </div>

      <div className='mb-4 md:mb-6'>
        <p className='text-gray-600 text-sm md:text-base'>
          Type: {wallet.type}
        </p>
      </div>

      <div className='mb-4 md:mb-6'>
        <p className='text-xs md:text-sm text-gray-500'>
          Created: {new Date(wallet.created_at).toLocaleDateString()}
        </p>
        <p className='text-xs md:text-sm text-gray-500'>
          Last updated: {new Date(wallet.updated_at).toLocaleDateString()}
        </p>
      </div>

      <div className='flex gap-4 flex-col sm:flex-row mb-6'>
        <Button
          variant='destructive'
          onClick={handleDelete}
          className='w-full sm:w-auto'
          disabled={deleteWalletMutation.isPending}
        >
          {deleteWalletMutation.isPending ? 'Deleting...' : 'Delete Wallet'}
        </Button>
      </div>

      <div className='mb-4 md:mb-6'>
        <h3 className='text-lg md:text-xl font-semibold mb-3 md:mb-4'>
          Recent Transactions
        </h3>
        {isTransactionsLoading ? (
          <p>Loading transactions...</p>
        ) : isTransactionsError ? (
          <p className='text-red-500'>Failed to load transactions.</p>
        ) : recentTransactions.length > 0 ? (
          <div className='space-y-2 md:space-y-3'>
            {recentTransactions.map(transaction => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                showActions={false}
              />
            ))}
          </div>
        ) : (
          <p className='text-gray-500'>No recent transactions</p>
        )}
      </div>
    </div>
  )
}
