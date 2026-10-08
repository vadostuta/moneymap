import { differenceInCalendarDays, getDaysInMonth } from 'date-fns'
import type { MonthlyPlan } from '@/lib/types/plan'
import type { WealthSnapshotSummary } from '@/lib/types/wealth'
import { currentMonth } from '../plan/plan'
import { parseSnapshotDate } from '../wealth/utils'

// A snapshot older than this is flagged as worth refreshing
export const STALE_SNAPSHOT_DAYS = 31

// ─── Spent vs plan ──────────────────────────────────────────────────────────

export interface SpendPace {
  // Share of the month gone, 0..1
  elapsed: number
  // What the plan expects to be spent by today if spending is even
  expected: number
  // spent − expected; positive means spending runs ahead of the plan
  ahead: number
}

export function spendPace (
  planned: number,
  spent: number,
  today: Date = new Date()
): SpendPace {
  const elapsed = today.getDate() / getDaysInMonth(today)
  const expected = planned * elapsed
  return { elapsed, expected, ahead: spent - expected }
}

// ─── Net worth ──────────────────────────────────────────────────────────────

export interface NetWorthChange {
  amount: number
  since: string // snapshot_date of the snapshot compared against
}

// Change against the previous snapshot, only when both share a currency
export function netWorthChange (
  snapshots: WealthSnapshotSummary[]
): NetWorthChange | null {
  const [latest, previous] = snapshots
  if (!latest || !previous) return null
  if (latest.display_currency !== previous.display_currency) return null
  return {
    amount: latest.net_worth - previous.net_worth,
    since: previous.snapshot_date
  }
}

export function snapshotAge (date: string, today: Date = new Date()): number {
  return differenceInCalendarDays(today, parseSnapshotDate(date))
}

// ─── Needs attention ────────────────────────────────────────────────────────

export type Attention =
  | { kind: 'checkpointDue'; month: string }
  | { kind: 'noPlan'; month: string }
  | { kind: 'noSnapshot' }
  | { kind: 'staleSnapshot'; days: number }
  | { kind: 'overClaimed'; amount: number; currency: string }

export function attentionItems (
  plans: MonthlyPlan[],
  snapshots: WealthSnapshotSummary[],
  today: Date = new Date()
): Attention[] {
  const now = currentMonth(today)
  const items: Attention[] = plans
    .filter(plan => !plan.closed_at && plan.month < now)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(plan => ({ kind: 'checkpointDue', month: plan.month }))

  if (!plans.some(plan => plan.month === now)) {
    items.push({ kind: 'noPlan', month: now })
  }

  const latest = snapshots[0]
  if (!latest) {
    items.push({ kind: 'noSnapshot' })
  } else {
    const days = snapshotAge(latest.snapshot_date, today)
    if (days > STALE_SNAPSHOT_DAYS) items.push({ kind: 'staleSnapshot', days })
    if (latest.free < 0) {
      items.push({
        kind: 'overClaimed',
        amount: -latest.free,
        currency: latest.display_currency
      })
    }
  }

  return items
}
