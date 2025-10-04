import { supabase } from '@/lib/supabase/client'
import { Template, CreateTemplateDTO } from '@/types/template'

export const templateService = {
  // Create a new template
  async create (template: CreateTemplateDTO): Promise<Template | null> {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) throw new Error('User must be logged in')

      console.log('Creating template:', {
        ...template,
        user_id: user.id
      })

      const { data, error } = await supabase
        .from('templates')
        .insert([
          {
            ...template,
            user_id: user.id
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Template created:', data)
      return data
    } catch (error) {
      console.error('Template creation failed:', error)
      throw error
    }
  },

  // Get all templates for the current user
  async getAll (): Promise<Template[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get a specific template by ID
  async getById (id: string): Promise<Template | null> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error) throw error
    return data
  },

  // Update a template
  async update (
    templateId: string,
    updates: Partial<{
      name: string
      blocks: Template['blocks']
      layout: Template['layout']
    }>
  ): Promise<void> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    const { error } = await supabase
      .from('templates')
      .update(updates)
      .eq('id', templateId)
      .eq('user_id', user.id)

    if (error) throw error
  },

  // Delete a template (soft delete)
  async delete (id: string): Promise<void> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    const { error } = await supabase
      .from('templates')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },

  // Restore a deleted template
  async restore (id: string): Promise<void> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    const { error } = await supabase
      .from('templates')
      .update({ is_deleted: false })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  }
}
