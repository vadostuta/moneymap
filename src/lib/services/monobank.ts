import { supabase } from '@/lib/supabase/client'
import { CreateTransactionDTO } from '../types/transaction'
import { getCategoryFromMCC } from './mcc-mapper'

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
    // Get category ID directly from MCC mapping
    const categoryId =
      getCategoryFromMCC(transaction.mcc) ||
      'e6ae9d7d-1e91-447d-8bcb-9940a5d9d3a0' // fallback category

    return {
      wallet_id: walletId,
      type: transaction.amount < 0 ? 'expense' : 'income',
      amount: Math.abs(transaction.amount) / 100,
      description: transaction.description || '',
      category_id: categoryId,
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

    // Get existing monobank IDs for this user and wallet - only check the ones we're about to insert
    const { data: existingTransactions, error: fetchError } = await supabase
      .from('transactions')
      .select('monobank_id')
      .eq('user_id', user.id)
      .eq('wallet_id', walletId)
      .in(
        'monobank_id',
        transactions.map(t => t.id)
      )
      .not('monobank_id', 'is', null)

    if (fetchError) throw fetchError

    // Create Sets for faster lookup
    const existingIds = new Set(
      existingTransactions?.map(t => t.monobank_id) || []
    )

    // Filter out existing transactions
    const newTransactions = transactions
      .filter(t => !existingIds.has(t.id))
      .map(t => ({
        ...this.transformTransaction(t, walletId),
        user_id: user.id,
        monobank_id: t.id
      }))

    if (newTransactions.length === 0) {
      console.log('No new transactions to insert')
      return
    }

    console.log(`Inserting ${newTransactions.length} new transactions`)

    // Insert all new transactions at once (no need for batching with small amounts)
    const { error } = await supabase
      .from('transactions')
      .insert(newTransactions)

    if (error) {
      if (error.code === '23505') {
        console.warn(
          'Duplicate transaction detected, this should not happen with the new logic'
        )
      }
      throw error
    }
  }

  static async getActiveIntegration () {
    const { data: integrations, error } = await supabase
      .from('bank_integrations')
      .select('wallet_id, wallet:wallets!inner(id)')
      .eq('provider', 'monobank')
      .eq('is_active', true)
      .eq('wallets.is_deleted', false)

    if (error || !integrations || integrations.length === 0) return null
    return integrations[0]
  }

  static async getLastSyncedTransaction () {
    const { data, error } = await supabase
      .from('transactions')
      .select('date, wallet:wallets!inner(id)')
      .eq('is_deleted', false)
      .eq('wallets.is_deleted', false)
      .not('monobank_id', 'is', null)
      .order('date', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) return null
    return data[0]
  }

  static async getDeletedTransactionIds () {
    const { data } = await supabase
      .from('transactions')
      .select('monobank_id')
      .eq('is_deleted', true)
      .not('monobank_id', 'is', null)

    return new Set(data?.map(t => t.monobank_id) || [])
  }

  static async syncTransactionsForDateRange (
    from: Date,
    to: Date
  ): Promise<void> {
    const integration = await MonobankService.getActiveIntegration()
    if (!integration) return

    try {
      const response = await MonobankService.fetchTransactions(from, to)
      if (response.transactions.length > 0) {
        await MonobankService.saveTransactions(
          response.transactions,
          integration.wallet_id
        )
      }
    } catch (error) {
      if (
        error instanceof Error &&
        'errorDescription' in error &&
        (error as { errorDescription: string }).errorDescription ===
          'Too many requests'
      ) {
        throw new Error('RATE_LIMIT_EXCEEDED')
      }
      throw error
    }
  }

  static async syncNewTransactions (): Promise<void> {
    const integration = await MonobankService.getActiveIntegration()
    if (!integration) return

    try {
      // Get the last synced transaction date
      const lastTransaction = await MonobankService.getLastSyncedTransaction()

      let from: Date
      const to = new Date()

      if (!lastTransaction) {
        // If no transactions exist, fetch last 7 days (more reasonable than 30)
        from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)
        console.log('No previous transactions found, fetching last 7 days')
      } else {
        // Start from the last synced transaction date
        from = new Date(lastTransaction.date)
      }

      // Monobank API limit: maximum 31 days per request
      const MAX_DAYS = 31
      const maxFromDate = new Date(to.getTime() - MAX_DAYS * 24 * 60 * 60 * 1000)

      if (from < maxFromDate) {
        console.log(
          `Date range exceeds ${MAX_DAYS} days. Limiting from ${from.toISOString()} to ${maxFromDate.toISOString()}`
        )
        from = maxFromDate
      }

      console.log(
        `Fetching transactions from ${from.toISOString()} to ${to.toISOString()}`
      )

      // Only fetch if there's a meaningful time gap (at least 1 minute)
      const timeDiff = to.getTime() - from.getTime()
      if (timeDiff < 60000) {
        // 1 minute in milliseconds
        console.log('Time gap too small, skipping sync')
        return
      }

      const response = await MonobankService.fetchTransactions(from, to)

      if (response.transactions.length > 0) {
        console.log(`Found ${response.transactions.length} new transactions`)
        await MonobankService.saveTransactions(
          response.transactions,
          integration.wallet_id
        )
      } else {
        console.log('No new transactions found')
      }
    } catch (error) {
      if (
        error instanceof Error &&
        'errorDescription' in error &&
        (error as { errorDescription: string }).errorDescription ===
          'Too many requests'
      ) {
        throw new Error('RATE_LIMIT_EXCEEDED')
      }
      throw error
    }
  }
}
