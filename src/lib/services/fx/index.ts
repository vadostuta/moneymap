import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { CurrencyType } from '@/lib/types/wallet'
import { ResolvedRate } from './types'

export type { ResolvedRate } from './types'

// Which source quotes which pair is decided here and nowhere else:
// anything involving UAH comes from the NBU (UAH per 1 X), everything else
// from the ECB (X per 1 EUR), crossed through EUR when neither side is EUR.

interface StoredRate {
  rate: number
  date: string
}

// Latest publication on or before `date`
async function latest (
  source: string,
  base: string,
  quote: string,
  date: string
): Promise<StoredRate | null> {
  const { data, error } = await supabase
    .from('fx_rates')
    .select('rate, rate_date')
    .eq('source', source)
    .eq('base', base)
    .eq('quote', quote)
    .lte('rate_date', date)
    .order('rate_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? { rate: Number(data.rate), date: data.rate_date } : null
}

const older = (a: string, b: string) => (a < b ? a : b)

async function uahRate (from: CurrencyType, to: CurrencyType, date: string) {
  const foreign = from === 'UAH' ? to : from
  const row = await latest('nbu', foreign, 'UAH', date)
  if (!row) return null
  return {
    rate: from === 'UAH' ? 1 / row.rate : row.rate,
    date: row.date,
    source: 'nbu'
  }
}

async function ecbRate (from: CurrencyType, to: CurrencyType, date: string) {
  // EUR per 1 unit is 1; X per 1 EUR comes from the table
  const perEur = async (currency: CurrencyType) =>
    currency === 'EUR'
      ? { rate: 1, date }
      : latest('ecb', 'EUR', currency, date)

  const [fromRow, toRow] = await Promise.all([perEur(from), perEur(to)])
  if (!fromRow || !toRow) return null
  return {
    // to per 1 from = (to per EUR) / (from per EUR)
    rate: toRow.rate / fromRow.rate,
    date: older(fromRow.date, toRow.date),
    source: 'ecb'
  }
}

export const fxService = {
  // display-currency units per 1 `from`, or null when nothing is stored
  async getRate (
    date: Date,
    from: CurrencyType,
    to: CurrencyType
  ): Promise<ResolvedRate | null> {
    const day = format(date, 'yyyy-MM-dd')
    if (from === to) return { rate: 1, date: day, source: 'same' }
    return from === 'UAH' || to === 'UAH'
      ? uahRate(from, to, day)
      : ecbRate(from, to, day)
  }
}
