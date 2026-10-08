import { supabase } from '@/lib/supabase/client'
import { Template, CreateTemplateDTO } from '@/types/template'

export const templateService = {
  // Create a new template
  async create (template: CreateTemplateDTO): Promise<Template | null> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

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

    if (error) throw error
    return data
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
      is_pinned: boolean
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

  // Soft delete, so the template can be restored (undo)
  async delete (id: string): Promise<void> {
    await templateService.setDeleted(id, true)
  },

  async restore (id: string): Promise<void> {
    await templateService.setDeleted(id, false)
  },

  async setDeleted (id: string, isDeleted: boolean): Promise<void> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    const { error } = await supabase
      .from('templates')
      .update({ is_deleted: isDeleted })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },

  // A copy with fresh block ids, never pinned
  async duplicate (template: Template, name: string): Promise<Template | null> {
    return templateService.create({
      name,
      layout: template.layout,
      blocks: template.blocks.map(block => ({
        ...block,
        id: crypto.randomUUID()
      }))
    })
  }
}
