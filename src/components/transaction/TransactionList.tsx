'use client'

import { useEffect, useState } from 'react'
import { Transaction } from '@/lib/types/transaction'
import { transactionService } from '@/lib/services/transaction'
import { Button } from '@/components/ui/button'
import { TransactionForm } from './TransactionForm'

interface TransactionListProps {
  refreshTrigger?: number
}

export function TransactionList ({ refreshTrigger }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null)

  useEffect(() => {
    loadTransactions()
  }, [refreshTrigger])

  const loadTransactions = async () => {
    try {
      const data = await transactionService.getAll()
      setTransactions(data)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      await transactionService.delete(id)
      await loadTransactions()
    } catch (error) {
      console.error('Failed to delete transaction:', error)
    }
  }

  if (loading) return <div>Loading transactions...</div>

  if (transactions.length === 0) {
    return (
      <div className='text-center text-gray-500 py-8'>No transactions yet</div>
    )
  }

  return (
    <div className='space-y-4'>
      {editingTransaction && (
        <div className='border rounded-lg mb-4'>
          <TransactionForm
            transaction={editingTransaction}
            onSuccess={() => {
              setEditingTransaction(null)
              loadTransactions()
            }}
            onCancel={() => setEditingTransaction(null)}
          />
        </div>
      )}

      <div
        className='grid grid-cols-auto-fill gap-4'
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
      >
        {transactions.map(transaction => (
          <div
            key={transaction.id}
            className='bg-dark dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 flex flex-col'
          >
            {/* Transaction info */}
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-2'>
                <span
                  className={`text-lg font-semibold ${
                    transaction.type === 'income'
                      ? 'text-emerald-500'
                      : 'text-white'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}{' '}
                  {transaction.amount}
                </span>
                <div className='ml-auto'>
                  <span className='text-xs px-2 py-1 bg-secondary rounded-full text-gray-600 dark:text-gray-300 text-white'>
                    {transaction.wallet?.name}
                  </span>
                </div>
              </div>

              <div className='text-sm font-medium text-gray-700 dark:text-grey-300 mb-2'>
                {transaction.category}
              </div>

              {transaction.description && (
                <div className='text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2'>
                  {transaction.description}
                </div>
              )}

              <div className='text-xs text-gray-400 dark:text-gray-500 mb-4'>
                {new Date(transaction.date).toLocaleDateString()}
              </div>
            </div>

            {/* Bottom section with label and actions */}
            <div className='pt-3 mt-auto border-t border-gray-100 dark:border-gray-700 flex items-center justify-between'>
              <span className='text-xs px-2 py-1 bg-secondary rounded-full'>
                {transaction.label}
              </span>

              <div className='flex items-center gap-2'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0 rounded-full'
                  onClick={() => setEditingTransaction(transaction)}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <path d='M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'></path>
                  </svg>
                  <span className='sr-only'>Edit</span>
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                  onClick={() => handleDelete(transaction.id)}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <path d='M3 6h18'></path>
                    <path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6'></path>
                    <path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'></path>
                  </svg>
                  <span className='sr-only'>Delete</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
