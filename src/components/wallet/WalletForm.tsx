'use client'

import { useState } from 'react'
import {
  CreateWalletDTO,
  WalletType,
  Wallet,
  CurrencyType
} from '@/lib/types/wallet'
import { walletService } from '@/lib/services/wallet'
import { Button } from '@/components/ui/button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation('common')
  const [formData, setFormData] = useState<CreateWalletDTO>({
    name: initialData?.name || '',
    type: initialData?.type || 'cash',
    balance: 0,
    currency: initialData?.currency || 'USD',
    is_primary: initialData?.is_primary || false,
    is_deleted: initialData?.is_deleted || false
  })

  const queryClient = useQueryClient()

  const createWalletMutation = useMutation({
    mutationFn: async (data: CreateWalletDTO) => {
      return await onCreateWallet(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      onSuccess()
    },
    onError: (error: Error) => {
      console.error(t('wallets.form.createError'), error)
    }
  })

  const updateWalletMutation = useMutation({
    mutationFn: async (data: CreateWalletDTO) => {
      if (!initialData) throw new Error(t('wallets.form.noWalletToUpdate'))
      return await walletService.update(initialData.id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      onSuccess()
    },
    onError: (error: Error) => {
      console.error(t('wallets.form.updateError'), error)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!initialData) {
      createWalletMutation.mutate(formData)
    } else {
      updateWalletMutation.mutate(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='p-3 sm:p-4 space-y-3 sm:space-y-4'>
      <div>
        <label className='block text-xs sm:text-sm font-medium mb-1'>
          {t('wallets.form.name')}
        </label>
        <input
          type='text'
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className='w-full p-2 text-sm sm:text-base border rounded bg-secondary'
          required
        />
      </div>

      <div>
        <label className='block text-xs sm:text-sm font-medium mb-1'>
          {t('wallets.form.type')}
        </label>
        <select
          value={formData.type}
          onChange={e =>
            setFormData({ ...formData, type: e.target.value as WalletType })
          }
          className='w-full p-2 text-sm sm:text-base border rounded bg-secondary'
        >
          <option value='credit'>{t('wallets.types.credit')}</option>
          <option value='debit'>{t('wallets.types.debit')}</option>
          <option value='cash'>{t('wallets.types.cash')}</option>
          <option value='bank'>{t('wallets.types.bank')}</option>
          <option value='crypto'>{t('wallets.types.crypto')}</option>
          <option value='savings'>{t('wallets.types.savings')}</option>
          <option value='investment'>{t('wallets.types.investment')}</option>
          <option value='ewallet'>{t('wallets.types.ewallet')}</option>
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
        <label className='block text-xs sm:text-sm font-medium mb-1'>
          {t('wallets.form.currency')}
        </label>
        <select
          value={formData.currency}
          onChange={e =>
            setFormData({
              ...formData,
              currency: e.target.value as CurrencyType
            })
          }
          className='w-full p-2 text-sm sm:text-base border rounded bg-secondary'
        >
          <option value='USD'>USD</option>
          <option value='EUR'>EUR</option>
          <option value='GBP'>GBP</option>
          <option value='UAH'>UAH</option>
          <option value='PLN'>PLN</option>
        </select>
      </div>

      <div className='flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2 mt-4 sm:mt-6'>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          className='w-full sm:w-auto h-9 sm:h-10'
        >
          {t('common.cancel')}
        </Button>
        <Button type='submit' className='w-full sm:w-auto h-9 sm:h-10'>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
