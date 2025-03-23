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

    // First check if user has any non-deleted wallets
    const { data: existingWallets } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_deleted', false)

    // If no existing wallets, this one should be primary
    const shouldBePrimary = !existingWallets || existingWallets.length === 0

    // If this will be primary, unset any existing primary wallets first
    if (shouldBePrimary || wallet.is_primary) {
      await supabase
        .from('wallets')
        .update({ is_primary: false })
        .eq('user_id', user.id)
    }

    const { data, error } = await supabase
      .from('wallets')
      .insert([
        {
          ...wallet,
          user_id: user.id,
          is_primary: shouldBePrimary || wallet.is_primary
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
    const { error: integrationError } = await supabase
      .from('bank_integrations')
      .update({ is_active: false })
      .eq('wallet_id', id)

    if (integrationError) throw integrationError

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
