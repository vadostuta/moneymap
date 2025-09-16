import { supabase } from '@/lib/supabase/client'
import { Category } from '@/lib/types/category'
import i18next from 'i18next'

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

    return categories.map(cat => {
      // If user has a custom name, use it
      if (userCatMap[cat.id]?.custom_name) {
        return {
          ...cat,
          name: userCatMap[cat.id].custom_name,
          is_active: userCatMap[cat.id]?.is_active ?? true
        }
      }

      // Map category names to translation keys
      const translationKeyMap: Record<string, string> = {
        'Restaurants & Cafés': 'food',
        'Food & Dining': 'food',
        Clothing: 'shopping',
        Transportation: 'transportation',
        'Bills & Utilities': 'bills',
        Entertainment: 'entertainment',
        Healthcare: 'healthcare',
        Education: 'education',
        Travel: 'travel',
        Presents: 'presents',
        Other: 'other',
        Donations: 'donations',
        Subscriptions: 'subscriptions',
        Groceries: 'groceries',
        Car: 'car',
        Home: 'home',
        Taxes: 'taxes',
        Electronics: 'electronics',
        Children: 'children',
        Parents: 'parents',
        Pets: 'pets',
        Sport: 'sport',
        'Style and Beauty': 'beauty',
        Extra: 'extra',
        Salary: 'salary',
        Transfers: 'transfers'
      }

      // Get the translation key for this category
      const translationKey =
        translationKeyMap[cat.name] || cat.name.toLowerCase()
      const translatedName = i18next.t(`categories.system.${translationKey}`, {
        defaultValue: cat.name
      })

      return {
        ...cat,
        name: translatedName,
        is_active: userCatMap[cat.id]?.is_active ?? true
      }
    })
  }
}
