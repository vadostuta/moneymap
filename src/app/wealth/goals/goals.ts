import { Claim } from '@/lib/types/claim'
import { CurrencyType } from '@/lib/types/wallet'
import { WealthSnapshotSummary } from '@/lib/types/wealth'
import { parseSnapshotDate } from '../utils'

const MS_PER_MONTH = (365.25 / 12) * 24 * 60 * 60 * 1000

const monthsBetween = (from: Date, to: Date) =>
  (to.getTime() - from.getTime()) / MS_PER_MONTH

export type GoalStatus =
  | 'reached'
  | 'overdue'
  | 'notStarted'
  | 'tooEarly'
  | 'onTrack'
  | 'behind'

export interface GoalPoint {
  date: string // yyyy-MM-dd
  amount: number
}

export interface Goal {
  claim: Claim
  target: number
  currency: CurrencyType
  targetDate: string
  // Oldest first, only snapshots in the goal's currency, from the first one
  // that put money towards this claim
  points: GoalPoint[]
  // Snapshots skipped because they are in another display currency
  skipped: number
  current: number
  progress: number
  remaining: number
  monthsLeft: number
  neededPace: number | null
  actualPace: number | null
  projected: Date | null
  status: GoalStatus
}

// A goal is a live, non-archived claim with a target amount, currency and date
export const isGoal = (claim: Claim) =>
  !claim.is_archived &&
  claim.target_amount !== null &&
  claim.target_amount > 0 &&
  claim.target_currency !== null &&
  claim.target_date !== null

// snapshots in any order; today injectable for testing
export function buildGoal (
  claim: Claim,
  snapshots: WealthSnapshotSummary[],
  today: Date = new Date()
): Goal {
  const target = claim.target_amount ?? 0
  const currency = claim.target_currency as CurrencyType
  const targetDate = claim.target_date as string

  const ascending = [...snapshots].sort((a, b) =>
    a.snapshot_date.localeCompare(b.snapshot_date)
  )
  const inCurrency = ascending.filter(s => s.display_currency === currency)
  const firstIndex = inCurrency.findIndex(s => claim.id in s.claim_amounts)
  const tracked = firstIndex === -1 ? [] : inCurrency.slice(firstIndex)
  const startDate = tracked[0]?.snapshot_date

  const points = tracked.map(s => ({
    date: s.snapshot_date,
    amount: s.claim_amounts[claim.id] ?? 0
  }))
  const skipped = startDate
    ? ascending.filter(
      s => s.display_currency !== currency && s.snapshot_date >= startDate
    ).length
    : 0

  const first = points[0]
  const last = points[points.length - 1]
  const current = last?.amount ?? 0
  const remaining = Math.max(0, target - current)
  const monthsLeft = monthsBetween(today, parseSnapshotDate(targetDate))

  const neededPace = monthsLeft > 0 ? remaining / monthsLeft : null

  const spanMonths =
    first && last
      ? monthsBetween(parseSnapshotDate(first.date), parseSnapshotDate(last.date))
      : 0
  const actualPace =
    points.length >= 2 && spanMonths > 0
      ? (last.amount - first.amount) / spanMonths
      : null

  const projected =
    actualPace !== null && actualPace > 0 && remaining > 0
      ? new Date(
        parseSnapshotDate(last.date).getTime() +
            (remaining / actualPace) * MS_PER_MONTH
      )
      : null

  let status: GoalStatus
  if (points.length > 0 && current >= target) status = 'reached'
  else if (monthsLeft <= 0) status = 'overdue'
  else if (points.length === 0) status = 'notStarted'
  else if (actualPace === null) status = 'tooEarly'
  else if (neededPace !== null && actualPace >= neededPace) status = 'onTrack'
  else status = 'behind'

  return {
    claim,
    target,
    currency,
    targetDate,
    points,
    skipped,
    current,
    progress: target > 0 ? current / target : 0,
    remaining,
    monthsLeft,
    neededPace,
    actualPace,
    projected,
    status
  }
}

export function buildGoals (
  claims: Claim[],
  snapshots: WealthSnapshotSummary[],
  today: Date = new Date()
): Goal[] {
  return claims
    .filter(isGoal)
    .map(claim => buildGoal(claim, snapshots, today))
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
}
