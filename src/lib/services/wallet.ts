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

    // Check if this is the first wallet
    const isFirst = await this.hasNoWallets()

    // Create the wallet with is_primary set based on isFirst
    const { data, error } = await supabase
      .from('wallets')
      .insert([
        {
          ...wallet,
          user_id: user.id,
          is_primary: isFirst || wallet.is_primary
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
    // First get the wallet to check if it's primary
    const { data: wallet } = await supabase
      .from('wallets')
      .select('is_primary')
      .eq('id', id)
      .single()

    // If this was the primary wallet, we need to set another wallet as primary
    if (wallet?.is_primary) {
      // Get the first non-deleted wallet that's not the one being deleted
      const { data: nextWallet } = await supabase
        .from('wallets')
        .select('id')
        .neq('id', id)
        .eq('is_deleted', false)
        .limit(1)
        .single()

      // If there's another wallet, make it primary
      if (nextWallet) {
        await supabase
          .from('wallets')
          .update({ is_primary: true })
          .eq('id', nextWallet.id)
      }
    }

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
  },

  async getAllActive (): Promise<
    { id: string; name: string; currency: string; is_primary: boolean }[]
  > {
    const { data, error } = await supabase
      .from('wallets')
      .select('id, name, currency, is_primary')
      .eq('is_deleted', false)

    if (error) throw error
    return data || []
  },

  async hasNoWallets (): Promise<boolean> {
    const { data, error } = await supabase
      .from('wallets')
      .select('id')
      .eq('is_deleted', false)
      .limit(1)

    if (error) throw error
    return data.length === 0
  },

  async restore (id: string): Promise<void> {
    const { error } = await supabase
      .from('wallets')
      .update({ is_deleted: false })
      .eq('id', id)

    if (error) throw error
  }
}
