import { CurrencyType } from '@/lib/types/wallet'
import { WealthSnapshotSummary } from '@/lib/types/wealth'
import { parseSnapshotDate } from './utils'

const DAYS_PER_MONTH = 365.25 / 12
const MS_PER_DAY = 24 * 60 * 60 * 1000

export interface HistoryRow extends WealthSnapshotSummary {
  // vs the previous snapshot in the same display currency; null for the first
  delta: number | null
}

export interface WealthHistory {
  currency: CurrencyType | null
  // Snapshots in the latest snapshot's currency, oldest first — what the chart plots
  series: WealthSnapshotSummary[]
  // Newest first, every snapshot
  rows: HistoryRow[]
  excluded: { count: number; currencies: CurrencyType[] }
  latest: HistoryRow | null
  previous: WealthSnapshotSummary | null
  pacePerMonth: number | null
}

// snapshots arrive newest first, as wealthService.getAll returns them
export function buildHistory (snapshots: WealthSnapshotSummary[]): WealthHistory {
  const currency = snapshots[0]?.display_currency ?? null
  const ascending = [...snapshots].reverse()

  const lastByCurrency = new Map<CurrencyType, WealthSnapshotSummary>()
  const deltas = new Map<string, number | null>()
  for (const snapshot of ascending) {
    const prior = lastByCurrency.get(snapshot.display_currency)
    deltas.set(snapshot.id, prior ? snapshot.net_worth - prior.net_worth : null)
    lastByCurrency.set(snapshot.display_currency, snapshot)
  }

  const rows = snapshots.map(snapshot => ({
    ...snapshot,
    delta: deltas.get(snapshot.id) ?? null
  }))
  const series = ascending.filter(s => s.display_currency === currency)
  const others = snapshots.filter(s => s.display_currency !== currency)

  let pacePerMonth: number | null = null
  if (series.length >= 2) {
    const first = series[0]
    const last = series[series.length - 1]
    const months =
      (parseSnapshotDate(last.snapshot_date).getTime() -
        parseSnapshotDate(first.snapshot_date).getTime()) /
      MS_PER_DAY /
      DAYS_PER_MONTH
    if (months > 0) pacePerMonth = (last.net_worth - first.net_worth) / months
  }

  return {
    currency,
    series,
    rows,
    excluded: {
      count: others.length,
      currencies: [...new Set(others.map(s => s.display_currency))]
    },
    latest: rows[0] ?? null,
    previous: series.length >= 2 ? series[series.length - 2] : null,
    pacePerMonth
  }
}
