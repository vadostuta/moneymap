'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Wallet } from '@/lib/types/wallet'
import {
  CreateTransactionDTO,
  TransactionType,
  TransactionCategory,
  TransactionLabel,
  Transaction
} from '@/lib/types/transaction'
import { walletService } from '@/lib/services/wallet'
import { transactionService } from '@/lib/services/transaction'

interface TransactionFormProps {
  transaction?: Transaction
  onSuccess: () => void
  onCancel: () => void
}

export function TransactionForm ({
  transaction,
  onSuccess,
  onCancel
}: TransactionFormProps) {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateTransactionDTO>(() => {
    if (transaction) {
      return {
        type: transaction.type,
        amount: transaction.amount,
        wallet_id: transaction.wallet_id,
        category: transaction.category,
        label: transaction.label,
        date: transaction.date,
        description: transaction.description || ''
      }
    }
    return {
      type: 'expense',
      amount: 0,
      wallet_id: '',
      category: 'Restaurants & Cafés',
      label: 'Personal',
      date: new Date().toISOString(),
      description: ''
    }
  })

  useEffect(() => {
    loadWallets()
  }, [])

  const loadWallets = async () => {
    try {
      const data = await walletService.getAll()
      setWallets(data)
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, wallet_id: data[0].id }))
      }
    } catch (error) {
      console.error('Failed to load wallets:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (transaction) {
        await transactionService.update(transaction.id, formData)
      } else {
        await transactionService.create(formData)
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save transaction:', error)
    } finally {
      setLoading(false)
    }
  }

  const transactionTypes: TransactionType[] = ['expense', 'income']
  const categories: TransactionCategory[] = [
    'Restaurants & Cafés',
    'Clothing',
    'Transportation',
    'Bills & Utilities',
    'Entertainment',
    'Healthcare',
    'Education',
    'Travel'
  ]
  const labels: TransactionLabel[] = [
    'Personal',
    'Business',
    'Family',
    'Important',
    'Recurring'
  ]

  return (
    <form onSubmit={handleSubmit} className='space-y-4 p-4'>
      <div>
        <label className='block text-sm font-medium mb-1'>Type</label>
        <select
          value={formData.type}
          onChange={e =>
            setFormData({
              ...formData,
              type: e.target.value as TransactionType
            })
          }
          className='w-full p-2 border rounded bg-secondary'
          required
        >
          {transactionTypes.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>Amount</label>
        <input
          type='number'
          value={formData.amount || ''}
          onChange={e =>
            setFormData({
              ...formData,
              amount: parseFloat(e.target.value) || 0
            })
          }
          className='w-full p-2 border rounded bg-secondary'
          required
          step='0.01'
        />
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>Wallet</label>
        <select
          value={formData.wallet_id}
          onChange={e =>
            setFormData({ ...formData, wallet_id: e.target.value })
          }
          className='w-full p-2 border rounded bg-secondary'
          required
        >
          {wallets.map(wallet => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name} ({wallet.balance} {wallet.currency})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>Category</label>
        <select
          value={formData.category}
          onChange={e =>
            setFormData({
              ...formData,
              category: e.target.value as TransactionCategory
            })
          }
          className='w-full p-2 border rounded bg-secondary'
          required
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>Label</label>
        <select
          value={formData.label}
          onChange={e =>
            setFormData({
              ...formData,
              label: e.target.value as TransactionLabel
            })
          }
          className='w-full p-2 border rounded bg-secondary'
          required
        >
          {labels.map(label => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>Date</label>
        <input
          type='datetime-local'
          value={
            formData.date
              ? new Date(formData.date).toISOString().slice(0, 16)
              : ''
          }
          onChange={e =>
            setFormData({
              ...formData,
              date: new Date(e.target.value).toISOString()
            })
          }
          className='w-full p-2 border rounded bg-secondary'
          required
        />
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>
          Description (optional)
        </label>
        <textarea
          value={formData.description || ''}
          onChange={e =>
            setFormData({ ...formData, description: e.target.value })
          }
          className='w-full p-2 border rounded bg-secondary'
          rows={3}
        />
      </div>

      <div className='flex justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type='submit' disabled={loading}>
          {loading
            ? 'Saving...'
            : transaction
            ? 'Update Transaction'
            : 'Create Transaction'}
        </Button>
      </div>
    </form>
  )
}
