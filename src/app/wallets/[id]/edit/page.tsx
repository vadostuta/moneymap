'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { walletService } from '@/lib/services/wallet'
import { Wallet, CreateWalletDTO } from '@/lib/types/wallet'
import { WalletForm } from '@/components/wallet/WalletForm'
import { useAuth } from '@/contexts/auth-context'
import { useQueryClient, useMutation } from '@tanstack/react-query'

export default function EditWalletPage ({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
  const { user, loading } = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loadingWallet, setLoadingWallet] = useState(true)
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await walletService.getById(id)
        if (data) setWallet(data)
        else router.push('/wallets')
      } catch {
        router.push('/wallets')
      } finally {
        setLoadingWallet(false)
      }
    }
    if (id) fetchWallet()
  }, [id, router])

  const updateWalletMutation = useMutation({
    mutationFn: async (walletData: Partial<Wallet>) => {
      if (!wallet) return
      await walletService.update(wallet.id, walletData as CreateWalletDTO)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', wallet?.id] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      router.push(`/wallets/${wallet?.id}`)
    },
    onError: error => {
      console.error('Failed to update wallet:', error)
    }
  })

  if (loading || loadingWallet) return <div className='p-6'>Loading...</div>
  if (!user)
    return <div className='p-6'>Please log in to edit your wallet.</div>
  if (!wallet) return <div className='p-6'>Wallet not found</div>

  return (
    <div className='p-4'>
      <h2 className='text-xl font-bold mb-4'>Edit Wallet</h2>
      <WalletForm
        initialData={wallet}
        onCreateWallet={updateWalletMutation.mutate}
        onCancel={() => router.push(`/wallets/${wallet.id}`)}
        onSuccess={() => router.push(`/wallets/${wallet.id}`)}
      />
    </div>
  )
}
