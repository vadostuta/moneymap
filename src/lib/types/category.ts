export interface Category {
  id: string
  name: string
  icon: string
  color_bg: string
  color_text: string
  is_system: boolean
  created_at: string
  updated_at: string
  user_id: string | null
  is_active: boolean
}
