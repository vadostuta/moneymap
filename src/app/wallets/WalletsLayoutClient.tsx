'use client'

import { WalletList } from '@/components/wallet/WalletList'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'

export default function WalletsLayoutClient ({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation('common')

  return (
    <div className='container py-3 sm:py-4 md:py-6 px-3 sm:px-4 md:px-6 mx-auto max-w-7xl'>
      <div className='flex items-center justify-between mb-3 sm:mb-4 md:mb-6'>
        <h1 className='text-lg sm:text-xl md:text-2xl font-bold'>
          {t('wallets.title')}
        </h1>
      </div>
      <div className='flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-6'>
        <div className='w-full md:w-64 md:min-w-[256px]'>
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
        <div className='flex-1 min-h-[300px] sm:min-h-[400px] md:min-h-[500px] border rounded-lg bg-background'>
          {children}
        </div>
      </div>
    </div>
  )
}
