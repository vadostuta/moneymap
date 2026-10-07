import { CurrencyType } from './wallet'

// 'fixed': value is an amount in the plan currency
// 'percent': value is a percentage of the month's total income
export type PlanLineKind = 'fixed' | 'percent'

// 'spend': the money leaves (rent, groceries); 'save': it is kept (investments)
export type PlanLineFlow = 'spend' | 'save'

export interface PlanIncome {
  id: string
  user_id: string
  plan_id: string
  label: string
  currency: CurrencyType
  amount: number
  rate: number
  // 'ecb' / 'nbu' when the rate was fetched; null when typed by hand
  rate_source: string | null
  // amount × rate, in the plan's currency
  converted_amount: number
  sort_order: number
  created_at: string
}

export interface PlanLine {
  id: string
  user_id: string
  plan_id: string
  label: string
  kind: PlanLineKind
  value: number
  flow: PlanLineFlow
  // Filled in at the end-of-month checkpoint; null = not checked yet
  actual_amount: number | null
  sort_order: number
  created_at: string
}

export interface MonthlyPlan {
  id: string
  user_id: string
  // First day of the month, 'yyyy-MM-01'
  month: string
  currency: CurrencyType
  note: string | null
  closed_at: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  incomes?: PlanIncome[]
  lines?: PlanLine[]
}

export type CreateMonthlyPlanDTO = Pick<
  MonthlyPlan,
  'month' | 'currency' | 'note' | 'closed_at'
>
export type UpdateMonthlyPlanDTO = Partial<CreateMonthlyPlanDTO>

export type CreatePlanIncomeDTO = Omit<
  PlanIncome,
  'id' | 'user_id' | 'plan_id' | 'created_at'
>

export type CreatePlanLineDTO = Omit<
  PlanLine,
  'id' | 'user_id' | 'plan_id' | 'created_at'
>

export const DEFAULT_PLAN_CURRENCY: CurrencyType = 'EUR'
