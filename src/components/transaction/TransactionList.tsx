'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { TransactionItem } from './TransactionItem'
import { QuickTransactionForm } from './QuickTransactionForm'
import { Transaction } from '@/lib/types/transaction'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'
import { transactionService } from '@/lib/services/transaction'

interface TransactionListProps {
  selectedDate?: Date
  searchQuery?: string
  selectedCategory?: string
  selectedWalletId: string | 'all'
  onDelete?: (id: string) => Promise<void>
}

const getRandomColor = () => {
  const colors = [
    'border-blue-500',
    'border-purple-500',
    'border-pink-500',
    'border-indigo-500',
    'border-teal-500',
    'border-orange-500',
    'border-cyan-500'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function TransactionList ({
  selectedDate,
  searchQuery,
  selectedCategory,
  selectedWalletId
}: TransactionListProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null)

  const fetchTransactions = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('Starting fetch with filters:', {
        selectedDate,
        selectedWalletId,
        searchQuery,
        selectedCategory
      })

      const fetchedTransactions =
        await transactionService.getFilteredTransactions({
          userId: user.id,
          walletId: selectedWalletId,
          searchQuery,
          category: selectedCategory
        })

      setTransactions(fetchedTransactions)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      toast({
        title: 'Error',
        description: 'Failed to load transactions. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user, selectedDate, searchQuery, selectedCategory, selectedWalletId])

  const handleDelete = async (id: string) => {
    try {
      await transactionService.softDelete(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
      toast({
        title: 'Transaction removed',
        description: 'The transaction has been successfully removed.'
      })
    } catch (error) {
      console.error('Error removing transaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove transaction. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
  }

  const handleEditSuccess = () => {
    setEditingTransaction(null)
    fetchTransactions() // Refresh the list
    toast({
      title: 'Transaction updated',
      description: 'The transaction has been successfully updated.'
    })
  }

  // Group transactions by date and assign colors
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const date = transaction.date.split('T')[0]
    if (!acc[date]) {
      acc[date] = {
        transactions: [],
        color: getRandomColor()
      }
    }
    acc[date].transactions.push(transaction)
    return acc
  }, {} as Record<string, { transactions: Transaction[]; color: string }>)

  if (loading) {
    return <div>Loading transactions...</div>
  }

  return (
    <div className='space-y-4'>
      {editingTransaction && (
        <div className='mb-6'>
          <QuickTransactionForm
            variant='wide'
            initialData={editingTransaction}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingTransaction(null)}
          />
        </div>
      )}

      {transactions.length > 0 ? (
        Object.entries(groupedTransactions).map(([date, group]) => (
          <div key={date} className='relative'>
            <div
              className={`absolute left-0 top-0 bottom-0 w-2 ${group.color} rounded-lg border-2`}
            />
            <div className='space-y-1'>
              {group.transactions.map(transaction => (
                <div key={transaction.id} className='ml-4'>
                  <TransactionItem
                    transaction={transaction}
                    showActions={!editingTransaction}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className='text-center text-muted-foreground py-8'>
          No transactions found
          {selectedDate && ` for ${format(selectedDate, 'MMMM d, yyyy')}`}.
        </p>
      )}
    </div>
  )
}
