import { SupabaseClient } from '@supabase/supabase-js'
import { ecbSource } from './ecb'
import { nbuSource } from './nbu'
import { RateSource } from './types'

// Server only: writes need the service role client.

const SOURCES: RateSource[] = [ecbSource, nbuSource]

export interface SyncResult {
  source: string
  stored?: number
  error?: string
}

// Fetch and upsert every source. Idempotent: re-running a date rewrites the
// same rows. A failing source is logged and skipped — its previous rows stay,
// and nothing is ever guessed in their place.
export async function syncRates (
  admin: SupabaseClient,
  date: Date = new Date()
): Promise<SyncResult[]> {
  return Promise.all(
    SOURCES.map(async source => {
      try {
        const rates = await source.fetchRates(date)
        if (rates.length === 0) return { source: source.name, stored: 0 }

        const { error } = await admin.from('fx_rates').upsert(
          rates.map(rate => ({
            rate_date: rate.date,
            base: rate.base,
            quote: rate.quote,
            rate: rate.rate,
            source: source.name
          })),
          { onConflict: 'rate_date,base,quote,source' }
        )
        if (error) throw error
        return { source: source.name, stored: rates.length }
      } catch (error) {
        console.error(`FX sync failed for ${source.name}:`, error)
        return {
          source: source.name,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    })
  )
}
