'use client'

import { useEffect, useState } from 'react'
import { Wallet } from '@/lib/types/wallet'
import { walletService } from '@/lib/services/wallet'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

interface WalletListProps {
  onSelectWallet: (wallet: Wallet) => void
  refreshTrigger?: number
  selectedWalletId?: string
}

export function WalletList ({
  onSelectWallet,
  refreshTrigger,
  selectedWalletId
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
            <div
              key={wallet.id}
              onClick={() => onSelectWallet(wallet)}
              className={cn(
                'flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-secondary/50',
                selectedWalletId === wallet.id ? 'bg-secondary' : ''
              )}
            >
              <div className='flex-1'>
                <h3 className='font-medium'>{wallet.name}</h3>
                <p className='text-sm text-muted-foreground'>
                  {wallet.balance} {wallet.currency}
                </p>
              </div>
              {wallet.is_primary && (
                <Star
                  className='h-4 w-4 fill-yellow-400 text-yellow-400'
                  aria-label='Primary wallet'
                />
              )}
            </div>
          ))
        ) : (
          <div className='p-4 text-center text-gray-500'>No wallets found</div>
        )}
      </div>
    </div>
  )
}
