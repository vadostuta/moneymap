'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Wallet } from '@/lib/types/wallet'
import { WalletList } from '@/components/wallet/WalletList'
import { WalletForm } from '@/components/wallet/WalletForm'
import { WalletDetail } from '@/components/wallet/WalletDetail'
import { walletService } from '@/lib/services/wallet'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

interface CreateWalletDTO {
  name: string
  currency: string
  type: string
  balance: number
  is_primary: boolean
  is_deleted: boolean
}

export default function WalletsPage () {
  const { user, loading } = useAuth()
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showMobileList, setShowMobileList] = useState(true)
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)

  const onSelectWallet = (wallet: Wallet) => {
    setSelectedWallet(wallet)
    setShowForm(false)
    setShowMobileList(false) // Hide list on mobile when wallet is selected
  }

  const refreshWallet = async () => {
    if (selectedWallet) {
      const updatedWallet = await walletService.getById(selectedWallet.id)
      if (updatedWallet) {
        setSelectedWallet(updatedWallet)
      }
      setRefreshTrigger(prev => prev + 1) // This will refresh the wallet list
    }
  }

  const handleEdit = (wallet: Wallet) => {
    setEditingWallet(wallet)
    setShowForm(true)
    setShowMobileList(false)
  }

  const checkIsFirstWallet = async () => {
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', user?.id)
      .eq('is_deleted', false)
      .limit(1)

    if (error) {
      console.error('Error checking wallets:', error)
      return false
    }

    return wallets.length === 0
  }

  const handleWalletCreate = async (
    walletData: Partial<Wallet>
  ): Promise<Wallet> => {
    if (!user?.id) {
      throw new Error('User not found')
    }

    const isFirst = await checkIsFirstWallet()

    // Type check the required fields
    if (!walletData.name || !walletData.currency || !walletData.type) {
      throw new Error('Missing required wallet fields')
    }

    const createData: CreateWalletDTO = {
      name: walletData.name,
      currency: walletData.currency,
      type: walletData.type,
      balance: walletData.balance ?? 0,
      is_primary: isFirst,
      is_deleted: false
    }

    const wallet = await walletService.create(createData)
    if (!wallet) throw new Error('Failed to create wallet')
    return wallet
  }

  if (loading) {
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

  return (
    <div className='container py-4 md:py-6 px-4 md:px-6'>
      <div className='flex items-center justify-between mb-4 md:mb-6'>
        <h1 className='text-xl md:text-2xl font-bold'>My Wallets</h1>
        <div className='flex items-center gap-2'>
          {!showMobileList && (
            <button
              onClick={() => setShowMobileList(true)}
              className='md:hidden px-3 py-1 text-sm bg-gray-100 rounded-md'
            >
              Back to list
            </button>
          )}
          <Button
            onClick={() => {
              setShowForm(true)
              setShowMobileList(false)
            }}
          >
            Add New Wallet
          </Button>
        </div>
      </div>

      <div className='flex flex-col md:flex-row gap-4 md:gap-6'>
        {/* Mobile: Show either list or detail */}
        <div
          className={`md:block ${showMobileList ? 'block' : 'hidden'} md:w-64`}
        >
          <WalletList
            onSelectWallet={onSelectWallet}
            refreshTrigger={refreshTrigger}
            selectedWalletId={selectedWallet?.id}
          />
        </div>

        <div
          className={`flex-1 min-h-[400px] md:min-h-[500px] border rounded-lg ${
            showMobileList ? 'hidden' : 'block'
          } md:block`}
        >
          {showForm ? (
            <WalletForm
              initialData={editingWallet || undefined}
              onCreateWallet={handleWalletCreate}
              onCancel={() => {
                setShowForm(false)
                setEditingWallet(null)
                setShowMobileList(true)
              }}
              onSuccess={() => {
                setShowForm(false)
                setEditingWallet(null)
                setSelectedWallet(null)
                setRefreshTrigger(prev => prev + 1)
                setShowMobileList(true)
              }}
            />
          ) : selectedWallet ? (
            <WalletDetail
              wallet={selectedWallet}
              onDelete={() => {
                setSelectedWallet(null)
                setRefreshTrigger(prev => prev + 1)
                setShowMobileList(true)
              }}
              onUpdate={refreshWallet}
              onEdit={() => handleEdit(selectedWallet)}
            />
          ) : (
            <div className='flex items-center justify-center h-full text-gray-500 p-4 text-center'>
              Select a wallet or create a new one
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
