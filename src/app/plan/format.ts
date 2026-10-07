import { monthDate } from './plan'

const dateLocale = (language: string) =>
  language === 'ua' ? 'uk-UA' : 'en-US'

// 'October 2026'
export function formatMonth (month: string, language: string): string {
  return monthDate(month).toLocaleDateString(dateLocale(language), {
    month: 'long',
    year: 'numeric'
  })
}

// 'Oct 26', for chart axes
export function formatShortMonth (month: string, language: string): string {
  return monthDate(month).toLocaleDateString(dateLocale(language), {
    month: 'short',
    year: '2-digit'
  })
}
