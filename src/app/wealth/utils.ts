import { CurrencyType, WalletType } from '@/lib/types/wallet'

export const WALLET_TYPES: WalletType[] = [
  'cash',
  'bank',
  'crypto',
  'savings',
  'investment'
]

export const CURRENCIES: CurrencyType[] = ['USD', 'EUR', 'UAH', 'GBP', 'PLN']

// snapshot_date is a plain 'yyyy-MM-dd' date; parse it as local, not UTC
export function parseSnapshotDate (date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const dateLocale = (language: string) =>
  language === 'ua' ? 'uk-UA' : 'en-US'

export function formatSnapshotDate (date: string, language: string): string {
  return parseSnapshotDate(date).toLocaleDateString(dateLocale(language), {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function formatShortDate (date: string | Date, language: string) {
  const value = typeof date === 'string' ? parseSnapshotDate(date) : date
  return value.toLocaleDateString(dateLocale(language), {
    day: 'numeric',
    month: 'short'
  })
}

export function formatRate (rate: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: 8
  }).format(rate)
}
