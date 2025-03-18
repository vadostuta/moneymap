'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import { MonobankIcon } from '@/components/icons/MonobankIcon'

interface BankIntegration {
  id: string
  user_id: string
  provider: 'monobank'
  api_token: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_sync_at: string | null
}

interface Props {
  refreshTrigger: number
  onIntegrationsChange?: (hasMonobank: boolean) => void
}

export function IntegrationsSection ({
  refreshTrigger,
  onIntegrationsChange
}: Props) {
  const [integrations, setIntegrations] = useState<BankIntegration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null)

  const fetchBankIntegrations = async () => {
    try {
      // First get the current user
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) {
        toast.error('Please sign in to view your integrations')
        return
      }

      // Then fetch their integrations
      const { data, error } = await supabase
        .from('bank_integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setIntegrations(data || [])

      // Notify parent about Monobank integration status
      const hasMonobank = (data || []).some(
        i => i.provider === 'monobank' && i.is_active
      )
      onIntegrationsChange?.(hasMonobank)
    } catch (error) {
      console.error('Error fetching bank integrations:', error)
      toast.error('Failed to load bank integrations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    setIsDisconnecting(integrationId)
    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser()

      if (userError) {
        console.error('Auth error:', userError)
        throw userError
      }

      if (!user) {
        throw new Error('No user found')
      }

      console.log('Attempting to delete integration:', {
        integrationId,
        userId: user.id
      })

      // Simplified delete operation
      const { error: deleteError, data: deletedData } = await supabase
        .from('bank_integrations')
        .delete()
        .eq('id', integrationId)
        .eq('user_id', user.id) // ensure we only delete user's own integration
        .select() // return the deleted row

      if (deleteError) {
        console.error('Delete error:', deleteError)
        throw deleteError
      }

      console.log('Deleted data:', deletedData)

      if (!deletedData || deletedData.length === 0) {
        throw new Error('No integration was deleted')
      }

      setIntegrations(prev => {
        const newIntegrations = prev.filter(i => i.id !== integrationId)
        // Notify parent about updated Monobank status
        const hasMonobank = newIntegrations.some(
          i => i.provider === 'monobank' && i.is_active
        )
        onIntegrationsChange?.(hasMonobank)
        return newIntegrations
      })

      toast.success('Bank disconnected successfully')
    } catch (error) {
      console.error('Error disconnecting bank:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to disconnect bank')
      }
    } finally {
      setIsDisconnecting(null)
    }
  }

  useEffect(() => {
    fetchBankIntegrations()
  }, [refreshTrigger])

  if (isLoading) {
    return (
      <div className='bg-card rounded-lg shadow p-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-6 w-48 bg-secondary rounded'></div>
          <div className='h-20 bg-secondary rounded'></div>
        </div>
      </div>
    )
  }

  if (integrations.length === 0) {
    return null
  }

  return (
    <div className='space-y-6'>
      <div className='bg-card rounded-lg shadow p-6'>
        <h2 className='text-xl font-semibold mb-4 text-foreground'>
          Connected Banks
        </h2>
        <div className='space-y-4'>
          {integrations.map(integration => (
            <div
              key={integration.id}
              className='flex items-center justify-between p-4 border border-border rounded-md bg-secondary'
            >
              <div className='flex items-center gap-3'>
                <div className='bg-white rounded-full p-1'>
                  <MonobankIcon className='w-6 h-6' />
                </div>
                <div>
                  <p className='font-medium text-foreground'>Monobank</p>
                  <p className='text-sm text-muted-foreground'>
                    Connected{' '}
                    {new Date(integration.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDisconnect(integration.id)}
                disabled={isDisconnecting === integration.id}
                className='text-destructive hover:text-destructive/90 disabled:opacity-50 transition-opacity'
              >
                {isDisconnecting === integration.id
                  ? 'Disconnecting...'
                  : 'Disconnect'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
