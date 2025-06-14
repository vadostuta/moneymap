'use client'

import { useState, useEffect } from 'react'
import { toastService } from '@/lib/services/toast'
import { MonobankIcon } from '@/components/icons/MonobankIcon'
import { MonobankService } from '@/lib/services/monobank'
import { walletService } from '@/lib/services/wallet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import Link from 'next/link'
import { subDays } from 'date-fns'
import { useTranslation } from 'react-i18next'

interface Props {
  onSuccess?: () => void
}

export function MonobankIntegration ({ onSuccess }: Props) {
  const { t } = useTranslation('common')
  const [token, setToken] = useState('')
  const [selectedWalletId, setSelectedWalletId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [wallets, setWallets] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function fetchWallets () {
      try {
        const walletData = await walletService.getAllActive()
        setWallets(walletData)
      } catch (error) {
        console.error('Failed to fetch wallets:', error)
        toastService.error(t('settings.integrations.loadWalletsError'))
      }
    }

    fetchWallets()
  }, [])

  const handleSaveMonobankToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWalletId) {
      toastService.error(t('settings.integrations.selectWalletError'))
      return
    }

    setIsLoading(true)

    try {
      await MonobankService.addIntegration(token, selectedWalletId)

      // Force immediate sync after successful integration
      localStorage.removeItem('lastMonobankFetch') // Reset last fetch time

      // Initial sync for the last 30 days
      await MonobankService.syncTransactionsForDateRange(
        subDays(new Date(), 30),
        new Date()
      )

      toastService.success(t('settings.integrations.monobankConnectSuccess'))
      setToken('')
      setSelectedWalletId('')
      onSuccess?.()
    } catch (error: unknown) {
      if (error instanceof Error) {
        toastService.error(
          error.message || t('settings.integrations.monobankTokenError')
        )
      } else {
        toastService.error(t('settings.integrations.unknownError'))
      }
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='bg-card rounded-lg shadow'>
      <div className='flex items-center gap-4 mb-6'>
        <div className='bg-white rounded-full p-1.5'>
          <MonobankIcon className='w-24 h-8' />
        </div>
        <h2 className='text-xl font-semibold text-foreground'>
          {t('settings.integrations.connectMonobank')}
        </h2>
      </div>

      <p className='text-muted-foreground mb-4'>
        {t('settings.integrations.monobankDescription')}
      </p>

      <form onSubmit={handleSaveMonobankToken}>
        <div className='space-y-4'>
          <div>
            <label
              htmlFor='monobankToken'
              className='block text-sm font-medium text-foreground mb-2'
            >
              {t('settings.integrations.monobankToken')}
            </label>
            <input
              id='monobankToken'
              type='password'
              value={token}
              onChange={e => setToken(e.target.value)}
              className='w-full p-2 border rounded-md bg-secondary text-foreground'
              placeholder={t('settings.integrations.enterMonobankToken')}
              pattern='[a-zA-Z0-9_-]{32,48}'
              required
            />
            <p className='text-sm text-muted-foreground mt-1'>
              {t('settings.integrations.getTokenFrom')}{' '}
              <a
                href='https://api.monobank.ua/'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline'
              >
                {t('settings.integrations.monobankApiPage')}
              </a>
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              {t('settings.integrations.selectWalletForSync')}
            </label>
            {wallets.length > 0 ? (
              <Select
                value={selectedWalletId}
                onValueChange={setSelectedWalletId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('settings.integrations.chooseWalletForSync')}
                  />
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
                  {t('settings.integrations.createWalletFirst')}{' '}
                  <Link
                    href='/wallets'
                    className='text-primary font-medium hover:underline'
                  >
                    {t('wallets.create')}
                  </Link>
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
          {isLoading
            ? t('settings.integrations.connecting')
            : t('settings.integrations.connectMonobank')}
        </button>
      </form>
    </div>
  )
}
