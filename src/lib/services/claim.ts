import { supabase } from '@/lib/supabase/client'
import { Claim, CreateClaimDTO, UpdateClaimDTO } from '@/lib/types/claim'

const normalize = (claim: Claim): Claim => ({
  ...claim,
  target_amount:
    claim.target_amount === null ? null : Number(claim.target_amount)
})

export const claimService = {
  // Includes archived claims; callers filter
  async getAll (): Promise<Claim[]> {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('is_deleted', false)
      .order('name')

    if (error) throw error
    return (data || []).map(normalize)
  },

  async create (input: CreateClaimDTO): Promise<Claim | null> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    const { data, error } = await supabase
      .from('claims')
      .insert([{ ...input, user_id: user.id }])
      .select()
      .single()

    if (error) throw error
    return data ? normalize(data) : null
  },

  async update (id: string, input: UpdateClaimDTO): Promise<Claim | null> {
    const { data, error } = await supabase
      .from('claims')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data ? normalize(data) : null
  },

  // Never a hard delete: past snapshot allocations keep pointing at the claim
  async softDelete (id: string): Promise<void> {
    const { error } = await supabase
      .from('claims')
      .update({ is_deleted: true })
      .eq('id', id)

    if (error) throw error
  }
}
