'use client'

import { useEffect } from 'react'
import { Wallet } from '@/lib/types/wallet'
import { walletService } from '@/lib/services/wallet'
import { cn } from '@/lib/utils'
import { Star, Wallet as WalletIcon, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation('common')

  const {
    data: wallets = [],
    isLoading,
    isError
  } = useQuery({
    queryKey: ['wallets'],
    queryFn: walletService.getAll,
    staleTime: 30000,
    retry: 2
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
      <div className='flex-1 overflow-y-auto max-h-[calc(100vh-200px)] md:max-h-none'>
        {wallets.length > 0 ? (
          wallets.map(wallet => (
            <div
              key={wallet.id}
              onClick={() => handleWalletClick(wallet)}
              className={cn(
                'group flex items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 mb-2 rounded-lg cursor-pointer transition-all duration-150',
                selectedWalletId === wallet.id
                  ? 'bg-primary/10 shadow-md scale-[1.02]'
                  : 'bg-background hover:bg-accent/40 hover:shadow-sm'
              )}
            >
              <div className='flex items-center gap-2 sm:gap-3 flex-1 min-w-0'>
                <div
                  className={cn(
                    'rounded-full p-1.5 sm:p-2 flex items-center justify-center flex-shrink-0',
                    selectedWalletId === wallet.id
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-primary'
                  )}
                >
                  <WalletIcon
                    className='h-4 w-4 sm:h-5 sm:w-5'
                    style={{
                      color:
                        selectedWalletId === wallet.id ? '#facc15' : undefined
                    }}
                  />
                </div>
                <div className='min-w-0 flex-1'>
                  <h3
                    className={cn(
                      'font-semibold text-sm sm:text-base truncate',
                      selectedWalletId === wallet.id
                        ? 'text-primary'
                        : 'text-foreground'
                    )}
                  >
                    {wallet.name}{' '}
                    {wallet.currency && (
                      <span className='font-normal text-xs text-muted-foreground'>
                        ({wallet.currency})
                      </span>
                    )}
                  </h3>
                </div>
              </div>
              {wallet.is_primary && (
                <Star
                  className='h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400 flex-shrink-0'
                  aria-label='Primary wallet'
                />
              )}
            </div>
          ))
        ) : (
          <div className='p-4 text-center text-gray-500'>
            {t('wallets.noWallets')}
          </div>
        )}
        {/* Add Wallet Button */}
        <div
          onClick={onAddWallet}
          className={cn(
            'group flex items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 mb-2 rounded-lg cursor-pointer transition-all duration-150 hover:bg-primary/5'
          )}
          tabIndex={0}
          role='button'
        >
          <div className='flex items-center gap-2 sm:gap-3 flex-1 min-w-0'>
            <div className='rounded-full p-1.5 sm:p-2 flex items-center justify-center bg-primary/10 text-primary flex-shrink-0'>
              <Plus className='h-4 w-4 sm:h-5 sm:w-5' />
            </div>
            <div className='min-w-0'>
              <h3 className='font-semibold text-sm sm:text-base text-primary truncate'>
                {t('wallets.add')}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
