import { format } from 'date-fns'
import { FetchedRate, RateSource } from './types'

// National Bank of Ukraine official rates: free, keyless, set for every
// calendar day. Quoted as UAH per 1 unit of the foreign currency.
const BASES = ['USD', 'EUR', 'GBP', 'PLN']

interface NbuRow {
  cc: string
  rate: number
  exchangedate: string // dd.MM.yyyy
}

export const nbuSource: RateSource = {
  name: 'nbu',

  async fetchRates (date: Date): Promise<FetchedRate[]> {
    const url =
      'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange' +
      `?date=${format(date, 'yyyyMMdd')}&json`

    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) throw new Error(`NBU responded ${response.status}`)

    const rows: NbuRow[] = await response.json()
    return rows
      .filter(row => BASES.includes(row.cc) && row.rate > 0)
      .map(row => {
        const [day, month, year] = row.exchangedate.split('.')
        return {
          date: `${year}-${month}-${day}`,
          base: row.cc,
          quote: 'UAH',
          rate: row.rate
        }
      })
  }
}
