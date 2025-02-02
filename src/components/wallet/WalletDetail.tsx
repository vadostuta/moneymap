'use client'

import { Wallet } from '@/lib/supabase/client'
import { walletService } from '@/lib/services/wallet'
import { Button } from '@/components/ui/button'

interface WalletDetailProps {
  wallet: Wallet
  onDelete: () => void
}

export function WalletDetail ({ wallet, onDelete }: WalletDetailProps) {
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this wallet?')) {
      try {
        await walletService.delete(wallet.id)
        onDelete()
      } catch (error) {
        console.error('Failed to delete wallet:', error)
      }
    }
  }

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold mb-2'>{wallet.name}</h2>
        <p className='text-gray-600'>Type: {wallet.type}</p>
      </div>

      <div className='mb-6'>
        <h3 className='text-xl font-semibold mb-2'>Balance</h3>
        <p className='text-3xl'>
          {wallet.balance} {wallet.currency}
        </p>
      </div>

      <div className='mb-6'>
        <p className='text-sm text-gray-500'>
          Created: {new Date(wallet.created_at).toLocaleDateString()}
        </p>
        <p className='text-sm text-gray-500'>
          Last updated: {new Date(wallet.updated_at).toLocaleDateString()}
        </p>
      </div>

      <Button variant='destructive' onClick={handleDelete}>
        Delete Wallet
      </Button>
    </div>
  )
}
