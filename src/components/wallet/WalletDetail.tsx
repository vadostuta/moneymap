'use client'

import { useEffect, useState, useCallback } from 'react'
import { Wallet } from '@/lib/types/wallet'
import { Transaction } from '@/lib/types/transaction'
import { walletService } from '@/lib/services/wallet'
import { transactionService } from '@/lib/services/transaction'
import { Button } from '@/components/ui/button'

interface WalletDetailProps {
  wallet: Wallet
  onDelete: () => void
}

export function WalletDetail ({ wallet, onDelete }: WalletDetailProps) {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  )
  const [loading, setLoading] = useState(true)

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
    if (confirm('Are you sure you want to delete this wallet?')) {
      try {
        await walletService.delete(wallet.id)
        onDelete()
      } catch (error) {
        console.error('Failed to delete wallet:', error)
      }
    }
  }

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold mb-2'>{wallet.name}</h2>
        <p className='text-gray-600'>Type: {wallet.type}</p>
      </div>

      <div className='mb-6'>
        <h3 className='text-xl font-semibold mb-2'>Balance</h3>
        <p className='text-3xl'>
          {wallet.balance} {wallet.currency}
        </p>
      </div>

      <div className='mb-6'>
        <p className='text-sm text-gray-500'>
          Created: {new Date(wallet.created_at).toLocaleDateString()}
        </p>
        <p className='text-sm text-gray-500'>
          Last updated: {new Date(wallet.updated_at).toLocaleDateString()}
        </p>
      </div>

      <div className='mb-6'>
        <h3 className='text-xl font-semibold mb-4'>Recent Transactions</h3>
        {loading ? (
          <p>Loading transactions...</p>
        ) : recentTransactions.length > 0 ? (
          <div className='space-y-3'>
            {recentTransactions.map(transaction => (
              <div
                key={transaction.id}
                className='border rounded p-3 flex justify-between items-center'
              >
                <div>
                  <div className='flex items-center gap-2'>
                    <span
                      className={`font-medium ${
                        transaction.type === 'income'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}{' '}
                      {transaction.amount} {wallet.currency}
                    </span>
                    <span className='text-sm text-gray-500'>
                      • {transaction.category}
                    </span>
                  </div>
                  {transaction.description && (
                    <p className='text-sm text-gray-600 mt-1'>
                      {transaction.description}
                    </p>
                  )}
                  <p className='text-xs text-gray-400 mt-1'>
                    {new Date(transaction.date).toLocaleString()}
                  </p>
                </div>
                <span className='text-xs px-2 py-1 bg-gray-100 rounded'>
                  {transaction.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-gray-500'>No recent transactions</p>
        )}
      </div>

      <Button variant='destructive' onClick={handleDelete}>
        Delete Wallet
      </Button>
    </div>
  )
}
