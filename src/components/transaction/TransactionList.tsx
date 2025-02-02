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

      {transactions.map(transaction => (
        <div
          key={transaction.id}
          className='border rounded-lg p-4 flex justify-between items-start'
        >
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <span
                className={`font-medium ${
                  transaction.type === 'income'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'} {transaction.amount}
              </span>
              <span className='text-gray-500'>•</span>
              <span className='text-gray-600'>{transaction.wallet?.name}</span>
            </div>
            <div className='text-sm text-gray-600 mb-1'>
              {transaction.category}
            </div>
            {transaction.description && (
              <div className='text-sm text-gray-500'>
                {transaction.description}
              </div>
            )}
            <div className='text-xs text-gray-400 mt-2'>
              {new Date(transaction.date).toLocaleString()}
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-xs px-2 py-1 bg-gray-100 rounded'>
              {transaction.label}
            </span>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setEditingTransaction(transaction)}
            >
              Edit
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => handleDelete(transaction.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
