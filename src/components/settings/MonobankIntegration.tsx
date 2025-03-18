'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { MonobankIcon } from '@/components/icons/MonobankIcon'
import { MonobankService } from '@/lib/services/monobank'

interface Props {
  onSuccess?: () => void
}

export function MonobankIntegration ({ onSuccess }: Props) {
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSaveMonobankToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await MonobankService.addIntegration(token)
      toast.success('Monobank integration added successfully!')
      setToken('')
      onSuccess?.()
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to save Monobank token')
      } else {
        toast.error('An unknown error occurred')
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
        <div className='mb-4'>
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
              href='https://api.monobank.ua/docs/'
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary hover:underline'
            >
              Monobank API page
            </a>
          </p>
        </div>
        <button
          type='submit'
          disabled={isLoading}
          className='bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50'
        >
          {isLoading ? 'Connecting...' : 'Connect Monobank'}
        </button>
      </form>
    </div>
  )
}
