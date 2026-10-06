export interface FetchedRate {
  // The publication date, which can differ from the requested one
  date: string // yyyy-MM-dd
  base: string
  quote: string
  // quote units per 1 base
  rate: number
}

export interface RateSource {
  readonly name: string // stored in fx_rates.source
  // Rates published on or shortly before `date`, so a weekend or holiday
  // request still brings back the prior publication
  fetchRates (date: Date): Promise<FetchedRate[]>
}

export interface ResolvedRate {
  // display units per 1 unit of `from` — the snapshot_lines.rate convention
  rate: number
  // Publication date actually used (the older one, for a cross rate)
  date: string
  source: string
}
