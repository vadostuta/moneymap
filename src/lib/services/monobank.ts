import { supabase } from '@/lib/supabase/client'
import { CreateTransactionDTO } from '../types/transaction'

export interface BankIntegration {
  id: string
  user_id: string
  provider: 'monobank'
  api_token: string
  wallet_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_sync_at: string | null
}

export interface MonobankTransaction {
  id: string
  time: number
  description: string
  mcc: number
  originalMcc: number
  amount: number
  operationAmount: number
  currencyCode: number
  commissionRate: number
  cashbackAmount: number
  balance: number
  hold: boolean
  receiptId?: string
  comment?: string
}

// interface MonobankTransactionToCreate {
//   id: string
//   wallet_id: string // This will need to be provided
//   type: 'expense' | 'income'
//   amount: number
//   description: string
//   category: TransactionCategory
//   date: string
//   label: TransactionLabel
// }

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

  static async addIntegration (token: string, walletId: string): Promise<void> {
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
      wallet_id: walletId,
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

  static async fetchTransactions (
    from: Date,
    to: Date
  ): Promise<{ transactions: MonobankTransaction[]; walletId: string }> {
    const integrations = await this.fetchIntegrations()
    const activeIntegration = integrations.find(
      i => i.is_active && i.provider === 'monobank'
    )

    if (!activeIntegration) {
      throw new Error('No active Monobank integration found')
    }

    const fromUnix = Math.floor(from.getTime() / 1000)
    const toUnix = Math.floor(to.getTime() / 1000)

    const response = await fetch(
      `https://api.monobank.ua/personal/statement/0/${fromUnix}/${toUnix}`,
      {
        headers: {
          'X-Token': activeIntegration.api_token
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`)
    }

    return {
      transactions: await response.json(),
      walletId: activeIntegration.wallet_id
    }
  }

  static transformTransaction (
    transaction: MonobankTransaction,
    walletId: string
  ): CreateTransactionDTO {
    return {
      wallet_id: walletId,
      type: transaction.amount < 0 ? 'expense' : 'income',
      amount: Math.abs(transaction.amount) / 100,
      description: transaction.description || '',
      category: 'Other',
      label: 'Personal',
      date: new Date(transaction.time * 1000).toISOString()
    }
  }

  static async saveTransactions (
    transactions: MonobankTransaction[],
    walletId: string
  ): Promise<void> {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) throw new Error('No user found')

    // First, get existing monobank transactions for this user
    const { data: existingTransactions, error: fetchError } = await supabase
      .from('transactions')
      .select('monobank_id')
      .eq('user_id', user.id)
      .eq('wallet_id', walletId)
      .not('monobank_id', 'is', null)

    if (fetchError) throw fetchError

    // Create a Set of existing monobank_ids for faster lookup
    const existingIds = new Set(
      existingTransactions?.map(t => t.monobank_id) || []
    )

    // Filter out transactions that already exist
    const newTransactions = transactions
      .filter(t => !t.description.includes('На charity'))
      .filter(t => !existingIds.has(t.id))
      .map(t => ({
        ...this.transformTransaction(t, walletId),
        user_id: user.id,
        monobank_id: t.id // Store the original Monobank ID
      }))

    if (newTransactions.length === 0) {
      return // No new transactions to save
    }

    // Insert only new transactions in batches
    const batchSize = 50
    for (let i = 0; i < newTransactions.length; i += batchSize) {
      const batch = newTransactions.slice(i, i + batchSize)
      const { error } = await supabase.from('transactions').insert(batch)
      if (error) throw error
    }
  }
}
