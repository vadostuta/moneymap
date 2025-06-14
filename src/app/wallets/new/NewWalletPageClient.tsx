'use client'
import { WalletForm } from '@/components/wallet/WalletForm'
import { useRouter } from 'next/navigation'
import { walletService } from '@/lib/services/wallet'
import { CreateWalletDTO, Wallet } from '@/lib/types/wallet'

export default function NewWalletPageClient () {
  const router = useRouter()
  return (
    <WalletForm
      onCreateWallet={async (walletData: Partial<Wallet>) => {
        // Ensure required fields for CreateWalletDTO
        const createData: CreateWalletDTO = {
          name: walletData.name || '',
          currency: walletData.currency || 'USD',
          type: walletData.type || 'cash',
          balance: walletData.balance ?? 0,
          is_primary: false,
          is_deleted: false
        }
        const wallet = await walletService.create(createData)
        if (!wallet) throw new Error('Failed to create wallet')
        router.push(`/wallets/${wallet.id}`)
        return wallet
      }}
      onCancel={() => router.push('/wallets')}
      onSuccess={() => router.push('/wallets')}
    />
  )
}
