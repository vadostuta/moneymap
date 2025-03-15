'use client'

import { useState } from 'react'
import { CreateWalletDTO, WalletType, Currency } from '@/lib/types/wallet'
import { walletService } from '@/lib/services/wallet'
import { Button } from '@/components/ui/button'

interface WalletFormProps {
  onCancel: () => void
  onSuccess: () => void
}

export function WalletForm ({ onCancel, onSuccess }: WalletFormProps) {
  const [formData, setFormData] = useState<CreateWalletDTO>({
    name: '',
    type: 'cash',
    balance: 0,
    currency: 'USD'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await walletService.create(formData)
      onSuccess()
    } catch (error) {
      console.error('Failed to create wallet:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='p-4 space-y-4'>
      <div>
        <label className='block text-sm font-medium mb-1'>Name</label>
        <input
          type='text'
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className='w-full p-2 border rounded'
          required
        />
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>Type</label>
        <select
          value={formData.type}
          onChange={e =>
            setFormData({ ...formData, type: e.target.value as WalletType })
          }
          className='w-full p-2 border rounded'
        >
          <option value='credit'>Credit</option>
          <option value='debit'>Debit</option>
          <option value='cash'>Cash</option>
          <option value='bank'>Bank</option>
          <option value='crypto'>Crypto</option>
          <option value='savings'>Savings</option>
          <option value='investment'>Investment</option>
          <option value='ewallet'>E-Wallet</option>
        </select>
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>Balance</label>
        <input
          type='number'
          value={formData.balance || ''}
          onChange={e => {
            const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
            setFormData({ ...formData, balance: value })
          }}
          className='w-full p-2 border rounded'
          required
        />
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>Currency</label>
        <select
          value={formData.currency}
          onChange={e =>
            setFormData({ ...formData, currency: e.target.value as Currency })
          }
          className='w-full p-2 border rounded'
        >
          <option value='USD'>USD</option>
          <option value='EUR'>EUR</option>
          <option value='GBP'>GBP</option>
          <option value='UAH'>UAH</option>
        </select>
      </div>

      <div className='flex justify-end space-x-2'>
        <Button type='button' variant='outline' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit'>Save</Button>
      </div>
    </form>
  )
}
