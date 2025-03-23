'use client'

import { useState } from 'react'
import {
  CreateWalletDTO,
  WalletType,
  Currency,
  Wallet
} from '@/lib/types/wallet'
import { walletService } from '@/lib/services/wallet'
import { Button } from '@/components/ui/button'

interface WalletFormProps {
  initialData?: Wallet
  onCancel: () => void
  onSuccess: () => void
  onCreateWallet: (walletData: Partial<Wallet>) => Promise<Wallet>
}

export function WalletForm ({
  initialData,
  onCancel,
  onSuccess,
  onCreateWallet
}: WalletFormProps) {
  const [formData, setFormData] = useState<CreateWalletDTO>({
    name: initialData?.name || '',
    type: initialData?.type || 'cash',
    balance: 0,
    currency: initialData?.currency || 'USD',
    is_primary: initialData?.is_primary || false,
    is_deleted: initialData?.is_deleted || false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!initialData) {
        await onCreateWallet(formData)
      } else {
        await walletService.update(initialData.id, formData)
      }

      onSuccess()
    } catch (error) {
      console.error('Failed to save wallet:', error)
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
          className='w-full p-2 border rounded bg-secondary'
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
          className='w-full p-2 border rounded bg-secondary'
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

      {/* Temporarily commented out balance field
      <div>
        <label className='block text-sm font-medium mb-1'>Balance</label>
        <input
          type='number'
          value={formData.balance || ''}
          onChange={e => {
            const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
            setFormData({ ...formData, balance: value })
          }}
          className='w-full p-2 border rounded bg-secondary'
          required
        />
      </div>
      */}

      <div>
        <label className='block text-sm font-medium mb-1'>Currency</label>
        <select
          value={formData.currency}
          onChange={e =>
            setFormData({ ...formData, currency: e.target.value as Currency })
          }
          className='w-full p-2 border rounded bg-secondary'
        >
          <option value='USD'>USD</option>
          <option value='EUR'>EUR</option>
          <option value='GBP'>GBP</option>
          <option value='UAH'>UAH</option>
          <option value='PLN'>PLN</option>
        </select>
      </div>

      <div className='flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2 mt-6'>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          className='w-full sm:w-auto'
        >
          Cancel
        </Button>
        <Button type='submit' className='w-full sm:w-auto'>
          Save
        </Button>
      </div>
    </form>
  )
}
