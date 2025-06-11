'use client'
import { WalletList } from '@/components/wallet/WalletList'
import { useRouter, usePathname } from 'next/navigation'
export default function WalletsLayout ({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className='container py-4 md:py-6 px-4 md:px-6 mx-auto max-w-7xl'>
      <div className='flex items-center justify-between mb-4 md:mb-6'>
        <h1 className='text-xl md:text-2xl font-bold'>My Wallets</h1>
      </div>
      <div className='flex flex-col md:flex-row gap-4 md:gap-6'>
        <div className='md:w-64'>
          <WalletList
            onSelectWallet={wallet => router.push(`/wallets/${wallet.id}`)}
            onAddWallet={() => router.push('/wallets/new')}
            selectedWalletId={
              pathname.startsWith('/wallets/')
                ? pathname.split('/')[2]
                : undefined
            }
          />
        </div>
        <div className='flex-1 min-h-[400px] md:min-h-[500px] border rounded-lg'>
          {children}
        </div>
      </div>
    </div>
  )
}
