'use client'

import { useEffect } from 'react'
import { Wallet } from '@/lib/types/wallet'
import { walletService } from '@/lib/services/wallet'
import { cn } from '@/lib/utils'
import { Star, Wallet as WalletIcon, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'

interface WalletListProps {
  onSelectWallet: (wallet: Wallet) => void
  onAddWallet?: () => void
  selectedWalletId?: string
}

export function WalletList ({
  onSelectWallet,
  onAddWallet,
  selectedWalletId
}: WalletListProps) {
  const pathname = usePathname()

  const {
    data: wallets = [],
    isLoading,
    isError
  } = useQuery({
    queryKey: ['wallets'],
    queryFn: walletService.getAll
  })

  // If on main wallets page and no selected wallet, select primary or first wallet
  useEffect(() => {
    if (pathname === '/wallets' && !selectedWalletId && wallets.length > 0) {
      const primaryWallet = wallets.find(w => w.is_primary) || wallets[0]
      onSelectWallet(primaryWallet)
    }
  }, [pathname, selectedWalletId, wallets, onSelectWallet])

  const handleWalletClick = (wallet: Wallet) => {
    onSelectWallet(wallet)
  }

  if (isLoading) return <div className='p-4'>Loading wallets...</div>
  if (isError)
    return <div className='p-4 text-red-500'>Failed to load wallets.</div>

  return (
    <div className='flex flex-col h-full border-0 rounded-lg md:rounded-none'>
      <div className='flex-1 overflow-y-auto max-h-[60vh] md:max-h-none'>
        {wallets.length > 0 ? (
          wallets.map(wallet => (
            <div
              key={wallet.id}
              onClick={() => handleWalletClick(wallet)}
              className={cn(
                'group flex items-center justify-between gap-3 p-3 mb-2 rounded-lg cursor-pointer transition-all duration-150',
                selectedWalletId === wallet.id
                  ? 'bg-primary/10 shadow-md scale-[1.02]'
                  : 'bg-background hover:bg-accent/40 hover:shadow-sm'
              )}
            >
              <div className='flex items-center gap-3 flex-1'>
                <div
                  className={cn(
                    'rounded-full p-2 flex items-center justify-center',
                    selectedWalletId === wallet.id
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-primary'
                  )}
                >
                  <WalletIcon
                    className='h-5 w-5'
                    style={{
                      color:
                        selectedWalletId === wallet.id
                          ? '#facc15' // yellow-400
                          : undefined
                    }}
                  />
                </div>
                <div>
                  <h3
                    className={cn(
                      'font-semibold text-base',
                      selectedWalletId === wallet.id
                        ? 'text-primary'
                        : 'text-foreground'
                    )}
                  >
                    {wallet.name}{' '}
                    <span className='font-normal text-xs text-muted-foreground'>
                      ({wallet.currency})
                    </span>
                  </h3>
                </div>
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
        {/* Add Wallet Button */}
        <div
          onClick={onAddWallet}
          className={cn(
            'group flex items-center justify-between gap-3 p-3 mb-2 rounded-lg cursor-pointer transition-all duration-150 hover:bg-primary/5'
          )}
          tabIndex={0}
          role='button'
        >
          <div className='flex items-center gap-3 flex-1'>
            <div className='rounded-full p-2 flex items-center justify-center bg-primary/10 text-primary'>
              <Plus className='h-5 w-5' />
            </div>
            <div>
              <h3 className='font-semibold text-base text-primary'>
                Add Wallet
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
