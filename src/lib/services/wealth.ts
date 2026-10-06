import { supabase } from '@/lib/supabase/client'
import {
  WealthSnapshot,
  WealthSnapshotSummary,
  CreateWealthSnapshotDTO,
  CreateSnapshotLineDTO,
  CreateSnapshotAllocationDTO,
  SnapshotLine,
  computeTotals,
  sumAllocations
} from '@/lib/types/wealth'

export const DUPLICATE_SNAPSHOT_DATE = 'DUPLICATE_SNAPSHOT_DATE'

const WITH_DETAILS =
  '*, lines:snapshot_lines(*), allocations:snapshot_allocations(*, claim:claims(name, created_at, target_amount, target_currency))'

// numeric columns can come back as strings; lines are ordered by sort_order,
// allocations by amount descending
function withNormalizedLines (snapshot: WealthSnapshot): WealthSnapshot {
  return {
    ...snapshot,
    allocations: (snapshot.allocations ?? [])
      .map(allocation => ({
        ...allocation,
        amount: Number(allocation.amount),
        claim: allocation.claim && {
          ...allocation.claim,
          target_amount:
            allocation.claim.target_amount === null
              ? null
              : Number(allocation.claim.target_amount)
        }
      }))
      .sort((a, b) => b.amount - a.amount),
    lines: (snapshot.lines ?? [])
      .map(line => ({
        ...line,
        amount: Number(line.amount),
        rate: Number(line.rate),
        converted_amount: Number(line.converted_amount)
      }))
      .sort((a, b) => a.sort_order - b.sort_order)
  }
}

export const wealthService = {
  // Insert the snapshot, then its lines and allocations. Supabase has no
  // client-side transaction, so a failed child insert removes the snapshot it
  // left behind (lines and allocations go with it via cascade).
  async create (
    snapshot: CreateWealthSnapshotDTO,
    lines: CreateSnapshotLineDTO[],
    allocations: CreateSnapshotAllocationDTO[] = []
  ): Promise<WealthSnapshot | null> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    const { data, error } = await supabase
      .from('wealth_snapshots')
      .insert([{ ...snapshot, user_id: user.id }])
      .select()
      .single()

    if (error) {
      // unique_violation on (user_id, snapshot_date)
      if (error.code === '23505') throw new Error(DUPLICATE_SNAPSHOT_DATE)
      throw error
    }

    const { error: linesError } = await supabase.from('snapshot_lines').insert(
      lines.map(line => ({
        ...line,
        user_id: user.id,
        snapshot_id: data.id
      }))
    )

    if (linesError) {
      await supabase.from('wealth_snapshots').delete().eq('id', data.id)
      throw linesError
    }

    if (allocations.length > 0) {
      const { error: allocationsError } = await supabase
        .from('snapshot_allocations')
        .insert(
          allocations.map(allocation => ({
            ...allocation,
            user_id: user.id,
            snapshot_id: data.id
          }))
        )

      if (allocationsError) {
        await supabase.from('wealth_snapshots').delete().eq('id', data.id)
        throw allocationsError
      }
    }

    return data
  },

  // Replace a snapshot's header, lines and allocations in one database
  // transaction (update_wealth_snapshot, see plans/wealth/07-edit.sql)
  async update (
    id: string,
    snapshot: CreateWealthSnapshotDTO,
    lines: CreateSnapshotLineDTO[],
    allocations: CreateSnapshotAllocationDTO[]
  ): Promise<void> {
    const { error } = await supabase.rpc('update_wealth_snapshot', {
      p_snapshot_id: id,
      p_snapshot: snapshot,
      p_lines: lines,
      p_allocations: allocations
    })

    if (error) {
      if (error.code === '23505') throw new Error(DUPLICATE_SNAPSHOT_DATE)
      throw error
    }
  },

  async getAll (): Promise<WealthSnapshotSummary[]> {
    const { data, error } = await supabase
      .from('wealth_snapshots')
      .select(
        '*, snapshot_lines(converted_amount, is_liquid), snapshot_allocations(claim_id, amount)'
      )
      .eq('is_deleted', false)
      .order('snapshot_date', { ascending: false })

    if (error) throw error
    return (data || []).map(
      ({
        snapshot_lines: lines,
        snapshot_allocations: allocations,
        ...snapshot
      }) => {
        const { netWorth, liquid } = computeTotals(
          (lines as Pick<SnapshotLine, 'converted_amount' | 'is_liquid'>[]).map(
            line => ({
              ...line,
              converted_amount: Number(line.converted_amount)
            })
          )
        )
        const amounts = (
          allocations as { claim_id: string; amount: number }[]
        ).map(allocation => ({
          claim_id: allocation.claim_id,
          amount: Number(allocation.amount)
        }))
        const earmarked = sumAllocations(amounts)
        return {
          ...(snapshot as WealthSnapshot),
          net_worth: netWorth,
          liquid,
          earmarked,
          free: liquid - earmarked,
          line_count: lines.length,
          claim_amounts: Object.fromEntries(
            amounts.map(allocation => [allocation.claim_id, allocation.amount])
          )
        }
      }
    )
  },

  async getById (id: string): Promise<WealthSnapshot | null> {
    const { data, error } = await supabase
      .from('wealth_snapshots')
      .select(WITH_DETAILS)
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error) throw error
    return data ? withNormalizedLines(data) : null
  },

  // Most recent live snapshot with its lines, or null when there is none
  async getLatest (): Promise<WealthSnapshot | null> {
    const { data, error } = await supabase
      .from('wealth_snapshots')
      .select(WITH_DETAILS)
      .eq('is_deleted', false)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data ? withNormalizedLines(data) : null
  },

  async softDelete (id: string): Promise<void> {
    const { error } = await supabase
      .from('wealth_snapshots')
      .update({ is_deleted: true })
      .eq('id', id)

    if (error) throw error
  }
}
