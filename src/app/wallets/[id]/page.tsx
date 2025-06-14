'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Wallet } from '@/lib/types/wallet'
import { WalletDetail } from '@/components/wallet/WalletDetail'
import { walletService } from '@/lib/services/wallet'
import { useRouter } from 'next/navigation'

export default function WalletPage ({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
  const { user, loading } = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loadingWallet, setLoadingWallet] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const data = await walletService.getById(id)
        if (data) {
          setWallet(data)
        } else {
          router.push('/wallets')
        }
      } catch (error) {
        console.error('Failed to load wallet:', error)
        router.push('/wallets')
      } finally {
        setLoadingWallet(false)
      }
    }

    if (id) {
      loadWallet()
    }
  }, [id, router])

  if (loading || loadingWallet) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-6 md:p-24'>
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-6 md:p-24'>
        Please log in to manage your wallets.
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-6 md:p-24'>
        Wallet not found
      </div>
    )
  }

  return (
    <WalletDetail
      walletId={wallet.id}
      onDelete={() => router.push('/wallets')}
    />
  )
}
