'use client'

import { useEffect, useState } from 'react'
import { Transaction } from '@/lib/types/transaction'
import { transactionService } from '@/lib/services/transaction'
import { TransactionForm } from './TransactionForm'
import { TransactionItem } from './TransactionItem'

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

      <div className='space-y-4'>
        {transactions.map(transaction => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            showActions={true}
            onEdit={setEditingTransaction}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}
