'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { TransactionForm } from '@/components/transaction/TransactionForm'
import { TransactionList } from '@/components/transaction/TransactionList'

export default function TransactionsPage () {
  const { user, loading } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  if (loading) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-24'>
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-24'>
        Please log in to manage your transactions.
      </div>
    )
  }

  return (
    <div className='container py-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Transactions</h1>
        <Button onClick={() => setShowForm(true)}>Add Transaction</Button>
      </div>

      {showForm ? (
        <div className='border rounded-lg mb-6'>
          <TransactionForm
            onSuccess={() => {
              setShowForm(false)
              setRefreshTrigger(prev => prev + 1) // Refresh list after adding
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : null}

      <TransactionList refreshTrigger={refreshTrigger} />
    </div>
  )
}
