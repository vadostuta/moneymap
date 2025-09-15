'use client'

import { createContext, JSX, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { walletService } from '@/lib/services/wallet'
import { Wallet, WalletType } from '@/lib/types/wallet'

// Special wallet object to represent "All wallets"
export const ALL_WALLETS: Wallet = {
  id: 'all',
  name: 'All wallets',
  currency: 'UAH', // Default currency for display
  is_primary: false,
  is_deleted: false,
  created_at: '',
  updated_at: '',
  user_id: '',
  balance: 0,
  type: 'wallet' as WalletType
}

type WalletContextType = {
  selectedWallet: Wallet | null
  setSelectedWallet: (wallet: Wallet | null) => void
  wallets: Wallet[]
  isLoading: boolean
  isAllWalletsSelected: boolean
}

export const WalletContext = createContext<WalletContextType | undefined>(
  undefined
)

export function WalletProvider ({
  children
}: {
  children: React.ReactNode
}): JSX.Element {
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)

  // Fetch available wallets
  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletService.getAllActive()
  })

  // Set default wallet when wallets are loaded
  useEffect(() => {
    if (wallets && wallets.length > 0 && !selectedWallet) {
      // First try to find a primary wallet
      const primaryWallet = wallets.find(wallet => wallet.is_primary)

      if (primaryWallet) {
        setSelectedWallet(primaryWallet as Wallet)
      } else {
        // Only if no primary wallet, fall back to the first wallet
        setSelectedWallet(wallets[0] as Wallet)
      }
    }
  }, [wallets, selectedWallet])

  const isAllWalletsSelected = selectedWallet?.id === 'all'

  const value: WalletContextType = {
    selectedWallet,
    setSelectedWallet,
    wallets: wallets as Wallet[],
    isLoading,
    isAllWalletsSelected
  }

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  )
}

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
