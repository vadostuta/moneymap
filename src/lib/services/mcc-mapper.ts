// MCC to category ID mapping (UUIDs from your DB)
export const MCC_CATEGORY_MAP: Record<number, string> = {
  // Food & Dining
  5812: '446c89e7-e370-4f83-8e48-7f5b9a221358', // Restaurants & Cafés
  5813: '446c89e7-e370-4f83-8e48-7f5b9a221358',
  5814: '446c89e7-e370-4f83-8e48-7f5b9a221358',
  5411: 'c665d97d-405a-4c6a-a7df-ef3c9f4fcd77', // Groceries
  5499: 'c665d97d-405a-4c6a-a7df-ef3c9f4fcd77',

  // Shopping
  5311: '139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6', // Clothing
  5310: '139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6', // Discount Stores
  5331: '139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6', // Variety Stores
  5999: '139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6', // Misc. Retail

  // Transportation & Fuel
  5541: '1dce321c-5b29-4994-aa21-165c5efd7cd7', // Service Stations
  5542: '1dce321c-5b29-4994-aa21-165c5efd7cd7', // Automated Fuel
  4111: '1dce321c-5b29-4994-aa21-165c5efd7cd7', // Transport Services
  4121: '1dce321c-5b29-4994-aa21-165c5efd7cd7', // Taxi/Limo
  4112: '1dce321c-5b29-4994-aa21-165c5efd7cd7', // Passenger Rail (extra)

  // Bills & Utilities / Telecom
  4900: '9c3bf797-3cab-4774-b443-65707645c675', // Utilities
  4899: '9c3bf797-3cab-4774-b443-65707645c675', // Pay TV
  4814: '9c3bf797-3cab-4774-b443-65707645c675', // Telecom services (extra)

  // Entertainment
  7832: '2557ddce-7aec-45e5-8932-63fe3b1f2fd6',
  7841: '2557ddce-7aec-45e5-8932-63fe3b1f2fd6',
  7991: '2557ddce-7aec-45e5-8932-63fe3b1f2fd6',

  // Healthcare
  8011: 'ffcdbf34-5d88-419c-9e56-7a3e94b74927',
  8021: 'ffcdbf34-5d88-419c-9e56-7a3e94b74927',
  8041: 'ffcdbf34-5d88-419c-9e56-7a3e94b74927',

  // Education
  8220: '5a1413cd-8b6c-4209-ab24-b91ea0cd18be',

  // Travel
  4511: '1428c16e-2359-4b37-b72c-30312d998fb7', // Airlines
  4722: '1428c16e-2359-4b37-b72c-30312d998fb7', // Travel Agencies

  // Beauty & Style
  7230: '11fa4c3f-5cae-4c34-aa46-a892c1259b24',
  7298: '11fa4c3f-5cae-4c34-aa46-a892c1259b24',

  // ✨ Donations / Charity (new)
  4829: 'd3ff9fc4-c203-4cea-8b27-f0ac2104c8fa', // Wire/Transfers often used for charity
  8398: 'd3ff9fc4-c203-4cea-8b27-f0ac2104c8fa' // Charitable & Social Service Orgs
}

export function getCategoryFromMCC (mcc: number): string | null {
  return MCC_CATEGORY_MAP[mcc] || null
}
