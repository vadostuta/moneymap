'use client'

import { useState, useEffect } from 'react'
import { toastService } from '@/lib/services/toast'
import { MonobankIcon } from '@/components/icons/MonobankIcon'
import { MonobankService } from '@/lib/services/monobank'
import { supabase } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import Link from 'next/link'
import { subDays } from 'date-fns'

interface Props {
  onSuccess?: () => void
}

export function MonobankIntegration ({ onSuccess }: Props) {
  const [token, setToken] = useState('')
  const [selectedWalletId, setSelectedWalletId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [wallets, setWallets] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function fetchWallets () {
      const { data, error } = await supabase
        .from('wallets')
        .select('id, name')
        .eq('is_deleted', false)

      if (!error && data) {
        setWallets(data)
      }
    }

    fetchWallets()
  }, [])

  const handleSaveMonobankToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWalletId) {
      toastService.error('Please select a wallet for syncing')
      return
    }

    setIsLoading(true)

    try {
      await MonobankService.addIntegration(token, selectedWalletId)

      // Force immediate sync after successful integration
      localStorage.removeItem('lastMonobankFetch') // Reset last fetch time
      await MonobankService.fetchTransactions(
        subDays(new Date(), 30), // Get last 30 days
        new Date()
      )

      toastService.success('Monobank connected and transactions synced!')
      setToken('')
      setSelectedWalletId('')
      onSuccess?.()
    } catch (error: unknown) {
      if (error instanceof Error) {
        toastService.error(error.message || 'Failed to save Monobank token')
      } else {
        toastService.error('An unknown error occurred')
      }
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='bg-card rounded-lg shadow p-6'>
      <div className='flex items-center gap-4 mb-6'>
        <div className='bg-white rounded-full p-1.5'>
          <MonobankIcon className='w-24 h-8' />
        </div>
        <h2 className='text-xl font-semibold text-foreground'>
          Connect Monobank
        </h2>
      </div>

      <p className='text-muted-foreground mb-4'>
        Connect your Monobank account to track transactions and balances
      </p>

      <form onSubmit={handleSaveMonobankToken}>
        <div className='space-y-4'>
          <div>
            <label
              htmlFor='monobankToken'
              className='block text-sm font-medium text-foreground mb-2'
            >
              Monobank API Token
            </label>
            <input
              id='monobankToken'
              type='password'
              value={token}
              onChange={e => setToken(e.target.value)}
              className='w-full p-2 border rounded-md bg-secondary text-foreground'
              placeholder='Enter your Monobank API token'
              pattern='[a-zA-Z0-9_-]{32,48}'
              required
            />
            <p className='text-sm text-muted-foreground mt-1'>
              You can get your API token from{' '}
              <a
                href='https://api.monobank.ua/'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline'
              >
                Monobank API page
              </a>
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Select Wallet for Syncing
            </label>
            {wallets.length > 0 ? (
              <Select
                value={selectedWalletId}
                onValueChange={setSelectedWalletId}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Choose wallet for auto-sync' />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map(wallet => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className='flex items-center gap-2 p-3 bg-secondary/50 rounded-md border border-border'>
                <p className='text-sm text-muted-foreground'>
                  To enable Monobank synchronization, you need to{' '}
                  <Link
                    href='/wallets'
                    className='text-primary font-medium hover:underline'
                  >
                    create a wallet
                  </Link>{' '}
                  first
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          type='submit'
          disabled={isLoading || !selectedWalletId}
          className='mt-6 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50'
        >
          {isLoading ? 'Connecting...' : 'Connect Monobank'}
        </button>
      </form>
    </div>
  )
}
