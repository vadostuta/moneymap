import { supabase } from '@/lib/supabase/client'
import {
  Transaction,
  CreateTransactionDTO,
  UpdateTransactionDTO
} from '@/lib/types/transaction'

export const transactionService = {
  // Create a new transaction
  async create (transaction: CreateTransactionDTO): Promise<Transaction | null> {
    // Get the current user
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          ...transaction,
          user_id: user.id,
          date: transaction.date || new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get all transactions for the current user
  async getAll (): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, wallet:wallets(name)')
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get transactions for a specific wallet
  async getByWalletId (walletId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, wallet:wallets(name)')
      .eq('wallet_id', walletId)
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get a specific transaction by ID
  async getById (id: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, wallet:wallets(name)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Update a transaction
  async update (
    id: string,
    updates: UpdateTransactionDTO
  ): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select('*, wallet:wallets(name)')
      .single()

    if (error) throw error
    return data
  },

  // Delete a transaction
  async delete (id: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id)

    if (error) throw error
  }
}
