import { format, subDays } from 'date-fns'
import { FetchedRate, RateSource } from './types'

// ECB euro reference rates: free, keyless, published on TARGET working days
// around 16:00 CET. No UAH — that pair comes from the NBU.
const QUOTES = ['USD', 'GBP', 'PLN']
const LOOKBACK_DAYS = 7

export const ecbSource: RateSource = {
  name: 'ecb',

  async fetchRates (date: Date): Promise<FetchedRate[]> {
    const url =
      'https://data-api.ecb.europa.eu/service/data/EXR/' +
      `D.${QUOTES.join('+')}.EUR.SP00.A` +
      `?startPeriod=${format(subDays(date, LOOKBACK_DAYS), 'yyyy-MM-dd')}` +
      `&endPeriod=${format(date, 'yyyy-MM-dd')}&format=csvdata`

    const response = await fetch(url, { cache: 'no-store' })
    // 404 means no publication in the window
    if (response.status === 404) return []
    if (!response.ok) throw new Error(`ECB responded ${response.status}`)

    const [header, ...rows] = (await response.text()).trim().split('\n')
    const columns = header.split(',')
    const currency = columns.indexOf('CURRENCY')
    const period = columns.indexOf('TIME_PERIOD')
    const value = columns.indexOf('OBS_VALUE')

    return rows
      .map(row => row.split(','))
      .map(cells => ({
        date: cells[period],
        base: 'EUR',
        quote: cells[currency],
        rate: Number(cells[value])
      }))
      .filter(rate => QUOTES.includes(rate.quote) && rate.rate > 0)
  }
}
