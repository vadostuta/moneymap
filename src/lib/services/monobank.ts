import { supabase } from '@/lib/supabase/client'

interface MonobankAccount {
  id: string
  balance: number
  currencyCode: number
  cashbackType: string
  // Add other fields as per Monobank API response
}

interface MonobankTransaction {
  id: string
  time: number
  description: string
  amount: number
  // Add other fields as per Monobank API response
}

export class MonobankService {
  private static BASE_URL = 'https://api.monobank.ua'
  private token: string

  constructor (token: string) {
    this.token = token
  }

  private async request<T> (endpoint: string): Promise<T> {
    const response = await fetch(`${MonobankService.BASE_URL}${endpoint}`, {
      headers: {
        'X-Token': this.token
      }
    })

    if (!response.ok) {
      throw new Error(`Monobank API error: ${response.statusText}`)
    }

    return response.json()
  }

  async validateToken (): Promise<boolean> {
    try {
      await this.request('/personal/client-info')
      return true
    } catch (error) {
      return false
    }
  }

  async getClientInfo () {
    return this.request<{ name: string; accounts: MonobankAccount[] }>(
      '/personal/client-info'
    )
  }

  async getTransactions (accountId: string, from: number, to: number) {
    return this.request<MonobankTransaction[]>(
      `/personal/statement/${accountId}/${from}/${to}`
    )
  }

  // Database operations
  static async saveToken (userId: string, token: string): Promise<void> {
    const { error } = await supabase.from('bank_integrations').upsert({
      user_id: userId,
      provider: 'monobank',
      api_token: token,
      is_active: true
    })

    if (error) throw error
  }

  static async getToken (userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('bank_integrations')
      .select('api_token')
      .eq('user_id', userId)
      .eq('provider', 'monobank')
      .eq('is_active', true)
      .single()

    if (error) throw error
    return data?.api_token || null
  }

  static async removeIntegration (userId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_integrations')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('provider', 'monobank')

    if (error) throw error
  }
}
