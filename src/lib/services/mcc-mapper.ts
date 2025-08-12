// MCC to category ID mapping (using actual UUIDs from your database)
export const MCC_CATEGORY_MAP: Record<number, string> = {
  // Food & Dining
  5812: '446c89e7-e370-4f83-8e48-7f5b9a221358', // Restaurants & Cafés
  5813: '446c89e7-e370-4f83-8e48-7f5b9a221358', // Drinking Places
  5814: '446c89e7-e370-4f83-8e48-7f5b9a221358', // Fast Food Restaurants
  5411: 'c665d97d-405a-4c6a-a7df-ef3c9f4fcd77', // Groceries
  5499: 'c665d97d-405a-4c6a-a7df-ef3c9f4fcd77', // Miscellaneous Food Stores

  // Shopping
  5311: '139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6', // Clothing
  5310: '139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6', // Discount Stores
  5331: '139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6', // Variety Stores
  5999: '139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6', // Miscellaneous Retail

  // Transportation
  5541: '1dce321c-5b29-4994-aa21-165c5efd7cd7', // Transportation
  5542: '1dce321c-5b29-4994-aa21-165c5efd7cd7', // Automated Fuel Dispensers
  4111: '1dce321c-5b29-4994-aa21-165c5efd7cd7', // Transportation Services
  4121: '1dce321c-5b29-4994-aa21-165c5efd7cd7', // Taxicabs and Limousines

  // Bills & Utilities
  4900: '9c3bf797-3cab-4774-b443-65707645c675', // Bills & Utilities
  4899: '9c3bf797-3cab-4774-b443-65707645c675', // Cable, Satellite, and Other Pay Television

  // Entertainment
  7832: '2557ddce-7aec-45e5-8932-63fe3b1f2fd6', // Entertainment
  7841: '2557ddce-7aec-45e5-8932-63fe3b1f2fd6', // Video Tape Rental Stores
  7991: '2557ddce-7aec-45e5-8932-63fe3b1f2fd6', // Tourist Attractions and Exhibits

  // Healthcare
  8011: 'ffcdbf34-5d88-419c-9e56-7a3e94b74927', // Healthcare
  8021: 'ffcdbf34-5d88-419c-9e56-7a3e94b74927', // Dentists
  8041: 'ffcdbf34-5d88-419c-9e56-7a3e94b74927', // Chiropractors

  // Education
  8220: '5a1413cd-8b6c-4209-ab24-b91ea0cd18be', // Education

  // Travel
  4511: '1428c16e-2359-4b37-b72c-30312d998fb7', // Travel
  4722: '1428c16e-2359-4b37-b72c-30312d998fb7', // Travel Agencies, Tour Operators

  // Beauty & Style
  7230: '11fa4c3f-5cae-4c34-aa46-a892c1259b24', // Style and Beauty
  7298: '11fa4c3f-5cae-4c34-aa46-a892c1259b24' // Health and Beauty Spas
}

export function getCategoryFromMCC (mcc: number): string | null {
  return MCC_CATEGORY_MAP[mcc] || null
}
