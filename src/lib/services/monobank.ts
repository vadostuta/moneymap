import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export interface BankIntegration {
  id: string
  user_id: string
  provider: 'monobank'
  api_token: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_sync_at: string | null
}

export class MonobankService {
  static async fetchIntegrations (): Promise<BankIntegration[]> {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) {
      throw new Error('Please sign in to view your integrations')
    }

    const { data, error } = await supabase
      .from('bank_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async addIntegration (token: string): Promise<void> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('No user found')

    if (!token.match(/^[a-zA-Z0-9_-]{32,48}$/)) {
      throw new Error('Invalid Monobank token format')
    }

    const { error } = await supabase.from('bank_integrations').insert({
      user_id: user.id,
      provider: 'monobank',
      api_token: token,
      is_active: true
    })

    if (error) throw error
  }

  static async disconnectIntegration (integrationId: string): Promise<void> {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) throw new Error('No user found')

    const { error, data: deletedData } = await supabase
      .from('bank_integrations')
      .delete()
      .eq('id', integrationId)
      .eq('user_id', user.id)
      .select()

    if (error) throw error
    if (!deletedData || deletedData.length === 0) {
      throw new Error('No integration was deleted')
    }
  }
}
