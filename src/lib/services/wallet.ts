import { supabase } from '@/lib/supabase/client'
import { Wallet, CreateWalletDTO, UpdateWalletDTO } from '@/lib/supabase/client'

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
      .single()

    if (error) throw error
    return data
  },

  // Update a wallet
  async update (id: string, updates: UpdateWalletDTO): Promise<Wallet | null> {
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
    const { error } = await supabase.from('wallets').delete().eq('id', id)

    if (error) throw error
  }
}
