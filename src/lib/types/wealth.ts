import { CurrencyType, WalletType } from './wallet'
import { Claim } from './claim'

export interface SnapshotLine {
  id: string
  user_id: string
  snapshot_id: string
  label: string
  type: WalletType
  currency: CurrencyType
  amount: number
  rate: number
  // 'ecb' / 'nbu' when the rate was fetched; null when typed by hand
  rate_source: string | null
  converted_amount: number
  is_liquid: boolean
  sort_order: number
  created_at: string
}

export interface WealthSnapshot {
  id: string
  user_id: string
  snapshot_date: string
  display_currency: CurrencyType
  note: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  lines?: SnapshotLine[]
  allocations?: SnapshotAllocation[]
}

// How much of a snapshot's money was promised to a claim on that date.
// amount is in the snapshot's display_currency.
export interface SnapshotAllocation {
  id: string
  user_id: string
  snapshot_id: string
  claim_id: string
  amount: number
  created_at: string
  claim?: Pick<
    Claim,
    'name' | 'created_at' | 'target_amount' | 'target_currency'
  >
}

// List rows carry only the line and allocation fields needed for the totals
export interface WealthSnapshotSummary extends WealthSnapshot {
  net_worth: number
  liquid: number
  earmarked: number
  // liquid − earmarked; never derived from net_worth
  free: number
  line_count: number
  // claim_id → amount promised to it in this snapshot
  claim_amounts: Record<string, number>
}

export type CreateWealthSnapshotDTO = Omit<
  WealthSnapshot,
  | 'id'
  | 'user_id'
  | 'created_at'
  | 'updated_at'
  | 'is_deleted'
  | 'lines'
  | 'allocations'
>
export type UpdateWealthSnapshotDTO = Partial<CreateWealthSnapshotDTO>

export type CreateSnapshotLineDTO = Omit<
  SnapshotLine,
  'id' | 'user_id' | 'snapshot_id' | 'created_at'
>
export type UpdateSnapshotLineDTO = Partial<CreateSnapshotLineDTO>

export type CreateSnapshotAllocationDTO = Pick<
  SnapshotAllocation,
  'claim_id' | 'amount'
>

export const DEFAULT_DISPLAY_CURRENCY: CurrencyType = 'EUR'

export const LIQUID_BY_DEFAULT: Record<WalletType, boolean> = {
  cash: true,
  bank: true,
  savings: false,
  investment: false,
  crypto: false
}

export function computeTotals (
  lines: Pick<SnapshotLine, 'converted_amount' | 'is_liquid'>[]
): { netWorth: number; liquid: number } {
  return lines.reduce(
    (acc, line) => ({
      netWorth: acc.netWorth + line.converted_amount,
      liquid: acc.liquid + (line.is_liquid ? line.converted_amount : 0)
    }),
    { netWorth: 0, liquid: 0 }
  )
}

export function sumAllocations (
  allocations: Pick<SnapshotAllocation, 'amount'>[]
): number {
  return allocations.reduce((sum, allocation) => sum + allocation.amount, 0)
}
