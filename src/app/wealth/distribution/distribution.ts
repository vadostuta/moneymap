import { SnapshotAllocation, WealthSnapshot, computeTotals, sumAllocations } from '@/lib/types/wealth'

// The bar has five categorical slots (--chart-1..5). Past five claims, the
// smallest fold into one neutral "Other" segment rather than cycling colours.
export const SERIES_SLOTS = 5

export interface BarSegment {
  key: string
  name: string | null // null → "Other"
  amount: number
  // 1-based colour slot; null for "Other"
  slot: number | null
}

export interface Distribution {
  netWorth: number
  liquid: number
  locked: number
  earmarked: number
  free: number
  over: number
  // Every allocation, amount descending — the table
  allocations: SnapshotAllocation[]
  // What the bar draws, amount descending
  segments: BarSegment[]
}

export function buildDistribution (snapshot: WealthSnapshot): Distribution {
  const { netWorth, liquid } = computeTotals(snapshot.lines ?? [])
  const allocations = [...(snapshot.allocations ?? [])].sort(
    (a, b) => b.amount - a.amount
  )
  const earmarked = sumAllocations(allocations)

  const shown =
    allocations.length <= SERIES_SLOTS
      ? allocations
      : allocations.slice(0, SERIES_SLOTS - 1)
  const folded = allocations.slice(shown.length)

  // Colour follows the claim, not its rank: slots go by when the claim was
  // created, so a claim keeps its colour when amounts shift between snapshots
  const slotByClaim = new Map(
    [...shown]
      .sort((a, b) =>
        (a.claim?.created_at ?? '').localeCompare(b.claim?.created_at ?? '')
      )
      .map((allocation, index) => [allocation.claim_id, index + 1])
  )

  const segments: BarSegment[] = shown.map(allocation => ({
    key: allocation.claim_id,
    name: allocation.claim?.name ?? '',
    amount: allocation.amount,
    slot: slotByClaim.get(allocation.claim_id) ?? null
  }))
  if (folded.length > 0) {
    segments.push({
      key: 'other',
      name: null,
      amount: sumAllocations(folded),
      slot: null
    })
  }

  return {
    netWorth,
    liquid,
    locked: netWorth - liquid,
    earmarked,
    free: liquid - earmarked,
    over: Math.max(0, earmarked - liquid),
    allocations,
    segments
  }
}
