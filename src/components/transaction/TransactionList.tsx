'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { TransactionItem } from './TransactionItem'
import { QuickTransactionForm } from './QuickTransactionForm'
import type { Transaction } from '@/lib/types/transaction'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'

interface TransactionListProps {
  selectedDate?: Date
  searchQuery?: string
  selectedCategory?: string
}

export function TransactionList ({
  selectedDate,
  searchQuery,
  selectedCategory
}: TransactionListProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null)

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user, selectedDate])

  async function fetchTransactions () {
    try {
      setLoading(true)
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })

      if (selectedDate) {
        const startDate = new Date(selectedDate)
        startDate.setHours(0, 0, 0, 0)

        const endDate = new Date(selectedDate)
        endDate.setHours(23, 59, 59, 999)

        query = query
          .gte('date', startDate.toISOString())
          .lte('date', endDate.toISOString())
      }

      if (searchQuery) {
        query = query.ilike('description', `%${searchQuery}%`)
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching transactions:', error)
        return
      }

      setTransactions(data || [])
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTransactions(prev => prev.filter(t => t.id !== id))
      toast({
        title: 'Transaction deleted',
        description: 'The transaction has been successfully deleted.'
      })
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete transaction. Please try again.',
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
        transactions.map(transaction => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            showActions={!editingTransaction} // Hide actions while editing
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
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
