import { Category } from '@/lib/types/category'

// Monobank category name to system category ID mapping
// Category IDs from mcc-mapper.ts
export const MONOBANK_CATEGORY_MAP: Record<string, string> = {
  // Food & Groceries
  'Supermarkets and groceries': 'c665d97d-405a-4c6a-a7df-ef3c9f4fcd77', // Groceries
  'Restaurants, cafes, bars': '446c89e7-e370-4f83-8e48-7f5b9a221358', // Food

  // Travel
  'Tourism': '1428c16e-2359-4b37-b72c-30312d998fb7', // Travel
  'Hotels': '1428c16e-2359-4b37-b72c-30312d998fb7', // Travel
  'Air tickets': '1428c16e-2359-4b37-b72c-30312d998fb7', // Travel

  // Shopping
  'Clothes and shoes': '139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6', // Clothing
  'Household appliances': '139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6', // Clothing/Shopping

  // Bills & Services
  'Services': '9c3bf797-3cab-4774-b443-65707645c675', // Bills & Utilities
  'Utilities and Internet': '9c3bf797-3cab-4774-b443-65707645c675', // Bills & Utilities

  // Entertainment
  'Entertainment': '2557ddce-7aec-45e5-8932-63fe3b1f2fd6', // Entertainment

  // Transfers - will be handled separately as 'transfer' type
  'Transfers': 'd3ff9c14-c203-4ec3-9827-f0ca2104c8fa', // Donations/Transfers
  'To card': 'd3ff9c14-c203-4ec3-9827-f0ca2104c8fa', // Transfers
  'Transfer crediting': 'd3ff9c14-c203-4ec3-9827-f0ca2104c8fa', // Transfers
  'Transfer from my card': 'd3ff9c14-c203-4ec3-9827-f0ca2104c8fa', // Transfers
  'From my card': 'd3ff9c14-c203-4ec3-9827-f0ca2104c8fa', // Transfers
  'Enrollment': 'd3ff9c14-c203-4ec3-9827-f0ca2104c8fa', // Income transfer

  // Savings
  'Savings': 'e6ae9d7d-1e91-447d-8bcb-9940a5d9d3a0', // Other

  // Other
  'Other': 'e6ae9d7d-1e91-447d-8bcb-9940a5d9d3a0' // Other
}

// Fallback category ID (Other)
export const FALLBACK_CATEGORY_ID = 'e6ae9d7d-1e91-447d-8bcb-9940a5d9d3a0'

/**
 * Maps a Monobank category name to a system category ID
 * @param monobankCategory - Category name from Monobank export
 * @param categories - List of available system categories
 * @returns Category ID to use
 */
export function mapMonobankCategory (
  monobankCategory: string,
  categories: Category[]
): string {
  // 1. Try direct mapping from our predefined map
  if (MONOBANK_CATEGORY_MAP[monobankCategory]) {
    return MONOBANK_CATEGORY_MAP[monobankCategory]
  }

  // 2. Try case-insensitive exact match on system category names
  const normalizedInput = monobankCategory.toLowerCase().trim()
  const matchedCategory = categories.find(
    cat => cat.name.toLowerCase() === normalizedInput
  )

  if (matchedCategory) {
    return matchedCategory.id
  }

  // 3. Try partial match (if category name contains the search term)
  const partialMatch = categories.find(cat =>
    normalizedInput.includes(cat.name.toLowerCase()) ||
    cat.name.toLowerCase().includes(normalizedInput)
  )

  if (partialMatch) {
    return partialMatch.id
  }

  // 4. Log unmapped category and return fallback
  console.warn(`Unmapped Monobank category: "${monobankCategory}", using fallback`)

  // Try to find "Other" category in system categories
  const otherCategory = categories.find(
    cat => cat.name.toLowerCase() === 'other'
  )

  return otherCategory?.id || FALLBACK_CATEGORY_ID
}

/**
 * Checks if a category represents a transfer
 * @param category - Category name from Monobank
 * @returns True if this is a transfer category
 */
export function isTransferCategory (category: string): boolean {
  const transferKeywords = [
    'transfer',
    'to card',
    'from card',
    'from my card',
    'enrollment'
  ]

  const normalizedCategory = category.toLowerCase()
  return transferKeywords.some(keyword => normalizedCategory.includes(keyword))
}
