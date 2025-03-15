'use client'

import { useEffect, useState } from 'react'
import { Wallet } from '@/lib/types/wallet'
import { walletService } from '@/lib/services/wallet'
import { Button } from '@/components/ui/button'

interface WalletListProps {
  onSelectWallet: (wallet: Wallet) => void
  onAddNew: () => void
  refreshTrigger?: number
}

export function WalletList ({
  onSelectWallet,
  onAddNew,
  refreshTrigger
}: WalletListProps) {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWallets()
  }, [refreshTrigger])

  const loadWallets = async () => {
    try {
      const data = await walletService.getAll()
      setWallets(data)
    } catch (error) {
      console.error('Failed to load wallets:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading wallets...</div>

  return (
    <div className='flex flex-col h-full w-64 border-r'>
      <div className='flex-1 overflow-y-auto'>
        {wallets.map(wallet => (
          <button
            key={wallet.id}
            onClick={() => onSelectWallet(wallet)}
            className='w-full p-4 text-left hover:bg-gray-100 border-b'
          >
            <h3 className='font-medium'>{wallet.name}</h3>
            <p className='text-sm text-gray-600'>
              {wallet.balance} {wallet.currency}
            </p>
            <p className='text-xs text-gray-500'>{wallet.type}</p>
          </button>
        ))}
      </div>
      <div className='p-4 border-t'>
        <Button onClick={onAddNew} className='w-full'>
          Add New Wallet
        </Button>
      </div>
    </div>
  )
}
