'use client'

import { useEffect, useState, useCallback } from 'react'
import { Wallet } from '@/lib/types/wallet'
import { Transaction } from '@/lib/types/transaction'
import { walletService } from '@/lib/services/wallet'
import { transactionService } from '@/lib/services/transaction'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TransactionItem } from '@/components/transaction/TransactionItem'
import Link from 'next/link'
import { toastService } from '@/lib/services/toast'

interface WalletDetailProps {
  wallet: Wallet
  onDelete: () => void
  onUpdate?: () => void
  onEdit: () => void
}

export function WalletDetail ({
  wallet,
  onDelete,
  onUpdate,
  onEdit
}: WalletDetailProps) {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  )
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadRecentTransactions = useCallback(async () => {
    try {
      const transactions = await transactionService.getByWalletId(wallet.id)
      setRecentTransactions(transactions.slice(0, 10)) // Get only the first 10
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [wallet.id])

  useEffect(() => {
    loadRecentTransactions()
  }, [loadRecentTransactions])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this wallet?')) return

    setIsDeleting(true)
    try {
      await walletService.delete(wallet.id)
      toastService.success('Wallet deleted successfully')
      onDelete()
    } catch (error) {
      if (error instanceof Error) {
        toastService.error(error.message)
      } else {
        toastService.error('Failed to delete wallet')
      }
      console.error('Error deleting wallet:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePrimaryToggle = async () => {
    try {
      await walletService.setPrimary(wallet.id)
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to set primary wallet:', error)
    }
  }

  return (
    <div className='p-4 md:p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl md:text-2xl font-bold mb-2'>{wallet.name}</h2>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={onEdit}>
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
        <h3 className='text-lg md:text-xl font-semibold mb-2'>Balance</h3>
        <p className='text-2xl md:text-3xl'>
          {wallet.balance} {wallet.currency}
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
        <Link href='/transactions' className='flex-1 sm:flex-none'>
          <Button variant='secondary' className='w-full'>
            View All Transactions
          </Button>
        </Link>
        <Button
          variant='destructive'
          onClick={handleDelete}
          className='w-full sm:w-auto'
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete Wallet'}
        </Button>
      </div>

      <div className='mb-4 md:mb-6'>
        <h3 className='text-lg md:text-xl font-semibold mb-3 md:mb-4'>
          Recent Transactions
        </h3>
        {loading ? (
          <p>Loading transactions...</p>
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
