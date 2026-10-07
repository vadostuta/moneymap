import { supabase } from '@/lib/supabase/client'
import {
  CreateMonthlyPlanDTO,
  CreatePlanIncomeDTO,
  CreatePlanLineDTO,
  MonthlyPlan
} from '@/lib/types/plan'

export const DUPLICATE_PLAN_MONTH = 'DUPLICATE_PLAN_MONTH'

const WITH_DETAILS = '*, incomes:plan_incomes(*), lines:plan_lines(*)'

// numeric columns can come back as strings; children are ordered by sort_order
function normalize (plan: MonthlyPlan): MonthlyPlan {
  return {
    ...plan,
    incomes: (plan.incomes ?? [])
      .map(income => ({
        ...income,
        amount: Number(income.amount),
        rate: Number(income.rate),
        converted_amount: Number(income.converted_amount)
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
    lines: (plan.lines ?? [])
      .map(line => ({
        ...line,
        value: Number(line.value),
        actual_amount:
          line.actual_amount === null ? null : Number(line.actual_amount)
      }))
      .sort((a, b) => a.sort_order - b.sort_order)
  }
}

export const planService = {
  // Every live plan with its incomes and lines, newest month first. Plans are
  // small (a handful of rows each), so the list loads them in full.
  async getAll (): Promise<MonthlyPlan[]> {
    const { data, error } = await supabase
      .from('monthly_plans')
      .select(WITH_DETAILS)
      .eq('is_deleted', false)
      .order('month', { ascending: false })

    if (error) throw error
    return (data || []).map(normalize)
  },

  // month is 'yyyy-MM-01'; null when that month has no plan yet
  async getByMonth (month: string): Promise<MonthlyPlan | null> {
    const { data, error } = await supabase
      .from('monthly_plans')
      .select(WITH_DETAILS)
      .eq('month', month)
      .eq('is_deleted', false)
      .maybeSingle()

    if (error) throw error
    return data ? normalize(data) : null
  },

  // Insert (id null) or replace a plan with its incomes and lines in one
  // database transaction (save_monthly_plan). Returns the plan id.
  async save (
    id: string | null,
    plan: CreateMonthlyPlanDTO,
    incomes: CreatePlanIncomeDTO[],
    lines: CreatePlanLineDTO[]
  ): Promise<string> {
    const { data, error } = await supabase.rpc('save_monthly_plan', {
      p_plan_id: id,
      p_plan: plan,
      p_incomes: incomes,
      p_lines: lines
    })

    if (error) {
      // unique_violation on (user_id, month)
      if (error.code === '23505') throw new Error(DUPLICATE_PLAN_MONTH)
      throw error
    }
    return data as string
  },

  // Close (checkpoint done) or reopen a month without touching its lines
  async setClosed (id: string, closed: boolean): Promise<void> {
    const { error } = await supabase
      .from('monthly_plans')
      .update({ closed_at: closed ? new Date().toISOString() : null })
      .eq('id', id)

    if (error) throw error
  },

  async softDelete (id: string): Promise<void> {
    const { error } = await supabase
      .from('monthly_plans')
      .update({ is_deleted: true })
      .eq('id', id)

    if (error) throw error
  }
}
