import { supabase } from '@/lib/supabase/client'
import { Wallet, CreateWalletDTO, UpdateWalletDTO } from '@/lib/types/wallet'

export const walletService = {
  // Create a new wallet
  async create (wallet: CreateWalletDTO): Promise<Wallet | null> {
    // Get the current user
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    const { data, error } = await supabase
      .from('wallets')
      .insert([
        {
          ...wallet,
          user_id: user.id // Add the user_id to the wallet data
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get all wallets for the current user
  async getAll (): Promise<Wallet[]> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get a specific wallet by ID
  async getById (id: string): Promise<Wallet | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error) throw error
    return data
  },

  // Update a wallet
  async update (id: string, updates: UpdateWalletDTO): Promise<Wallet | null> {
    // If setting this wallet as primary, unset any other primary wallets first
    if (updates.is_primary) {
      await supabase.from('wallets').update({ is_primary: false }).neq('id', id)
    }

    const { data, error } = await supabase
      .from('wallets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a wallet
  async delete (id: string): Promise<void> {
    // First check if this is a primary wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('is_primary')
      .eq('id', id)
      .single()

    if (wallet?.is_primary) {
      throw new Error(
        'Cannot delete primary wallet. Please set another wallet as primary first.'
      )
    }

    // Soft delete the wallet
    const { error } = await supabase
      .from('wallets')
      .update({ is_deleted: true })
      .eq('id', id)

    if (error) throw error
  },

  async setPrimary (walletId: string): Promise<void> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    // Start a transaction to update all wallets
    const { error } = await supabase.rpc('set_primary_wallet', {
      wallet_id_input: walletId
    })

    if (error) throw error
  }
}
