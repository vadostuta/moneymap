import { supabase } from '@/lib/supabase/client'
import { Category } from '@/lib/types/category'

export const categoryService = {
  async update (
    categoryId: string,
    updates: Partial<{ custom_name: string; is_active: boolean }>
  ): Promise<void> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    // Try to upsert (insert or update) the user's customization for this category
    const { error } = await supabase.from('user_categories').upsert(
      [
        {
          user_id: user.id,
          category_id: categoryId,
          ...updates,
          updated_at: new Date().toISOString()
        }
      ],
      { onConflict: 'user_id,category_id' }
    )

    if (error) throw error
  },

  async getAllCategories (): Promise<Category[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    // Fetch all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    if (categoriesError) throw categoriesError

    // Fetch user's category customizations
    const { data: userCategories, error: userCategoriesError } = await supabase
      .from('user_categories')
      .select('category_id, custom_name, is_active')
      .eq('user_id', user.id)
    if (userCategoriesError) throw userCategoriesError

    // Merge the user customizations into the categories
    const userCatMap = Object.fromEntries(
      userCategories.map(uc => [uc.category_id, uc])
    )

    return categories.map(cat => ({
      ...cat,
      name: userCatMap[cat.id]?.custom_name ?? cat.name,
      is_active: userCatMap[cat.id]?.is_active ?? true
    }))
  }
}
