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

  if (loading) return <div className='p-4'>Loading wallets...</div>

  return (
    <div className='flex flex-col h-full border rounded-lg md:rounded-none md:border-r md:border-l-0 md:border-t-0 md:border-b-0'>
      <div className='flex-1 overflow-y-auto max-h-[60vh] md:max-h-none'>
        {wallets.length > 0 ? (
          wallets.map(wallet => (
            <button
              key={wallet.id}
              onClick={() => onSelectWallet(wallet)}
              className='w-full p-3 md:p-4 text-left hover:bg-secondary border-b flex justify-between items-center'
            >
              <div>
                <h3 className='font-medium text-sm md:text-base'>
                  {wallet.name}
                </h3>
                <p className='text-xs md:text-sm text-gray-500'>
                  {wallet.type}
                </p>
              </div>
              <p className='text-sm md:text-base font-medium'>
                {wallet.balance} {wallet.currency}
              </p>
            </button>
          ))
        ) : (
          <div className='p-4 text-center text-gray-500'>No wallets found</div>
        )}
      </div>
      <div className='p-3 md:p-4 border-t'>
        <Button onClick={onAddNew} className='w-full'>
          Add New Wallet
        </Button>
      </div>
    </div>
  )
}
