'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Wallet } from '@/lib/supabase/client'
import { WalletList } from '@/components/wallet/WalletList'
import { WalletForm } from '@/components/wallet/WalletForm'
import { WalletDetail } from '@/components/wallet/WalletDetail'

export default function Home () {
  const { user, loading } = useAuth()
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  if (loading) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center p-24'>
        Loading...
      </main>
    )
  }

  if (!user) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center p-24'>
        Please log in to manage your wallets.
      </main>
    )
  }

  return (
    <main className='flex min-h-screen'>
      <WalletList
        onSelectWallet={setSelectedWallet}
        onAddNew={() => setShowForm(true)}
        refreshTrigger={refreshTrigger}
      />

      <div className='flex-1'>
        {showForm ? (
          <WalletForm
            onCancel={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false)
              setSelectedWallet(null)
              setRefreshTrigger(prev => prev + 1)
            }}
          />
        ) : selectedWallet ? (
          <WalletDetail
            wallet={selectedWallet}
            onDelete={() => {
              setSelectedWallet(null)
              setRefreshTrigger(prev => prev + 1)
            }}
          />
        ) : (
          <div className='flex items-center justify-center h-full text-gray-500'>
            Select a wallet or create a new one
          </div>
        )}
      </div>
    </main>
  )
}
