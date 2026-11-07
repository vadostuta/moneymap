'use client'

import { PageContainer, PageHeader } from '@/components/ui/page'
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
    <PageContainer style={{ minWidth: 'calc(100% - 5vw)' }} className='space-y-4 sm:space-y-6'>
      <PageHeader title={t('wallets.title')} />
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
    </PageContainer>
  )
}
