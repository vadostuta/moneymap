import type {
  CreatePlanIncomeDTO,
  CreatePlanLineDTO,
  MonthlyPlan,
  PlanIncome,
  PlanLine,
  PlanLineFlow
} from '@/lib/types/plan'

// ─── Months ─────────────────────────────────────────────────────────────────
// A plan's month is stored as 'yyyy-MM-01' and shown in URLs as 'yyyy-MM'.
// Plain string arithmetic, so no time zone can move a month.

const pad = (n: number) => String(n).padStart(2, '0')

export function monthKey (year: number, month: number): string {
  const total = year * 12 + (month - 1)
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}-01`
}

export function currentMonth (today: Date = new Date()): string {
  return monthKey(today.getFullYear(), today.getMonth() + 1)
}

export function addMonths (month: string, count: number): string {
  const [year, m] = month.split('-').map(Number)
  return monthKey(year, m + count)
}

// 'yyyy-MM' (URL) → 'yyyy-MM-01', or null when it isn't a valid month
export function monthFromParam (param: string): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(param)
  if (!match) return null
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return `${match[1]}-${match[2]}-01`
}

export const monthToParam = (month: string) => month.slice(0, 7)

// Local Date for the first day of the month (for toLocaleDateString)
export function monthDate (month: string): Date {
  const [year, m] = month.split('-').map(Number)
  return new Date(year, m - 1, 1)
}

// The month "New month" should open: this month if it has no plan yet,
// otherwise the month after the latest plan
export function nextMonthToPlan (
  plans: Pick<MonthlyPlan, 'month'>[],
  today: Date = new Date()
): string {
  const now = currentMonth(today)
  if (!plans.some(plan => plan.month === now)) return now
  const latest = plans.reduce(
    (max, plan) => (plan.month > max ? plan.month : max),
    now
  )
  return addMonths(latest, 1)
}

// The plan a new month is copied from: the latest one before it, else the
// latest overall, else none
export function previousPlan<T extends Pick<MonthlyPlan, 'month'>> (
  plans: T[],
  month: string
): T | null {
  const sorted = [...plans].sort((a, b) => b.month.localeCompare(a.month))
  return sorted.find(plan => plan.month < month) ?? sorted[0] ?? null
}

// ─── Amounts ────────────────────────────────────────────────────────────────

type IncomeLike = Pick<PlanIncome, 'converted_amount'>
type LineLike = Pick<PlanLine, 'kind' | 'value' | 'flow' | 'actual_amount'>

export function planIncome (incomes: IncomeLike[]): number {
  return incomes.reduce((sum, income) => sum + income.converted_amount, 0)
}

// Planned amount of a line in the plan currency
export function lineAmount (
  line: Pick<PlanLine, 'kind' | 'value'>,
  income: number
): number {
  return line.kind === 'percent' ? (income * line.value) / 100 : line.value
}

export interface PlanTotals {
  income: number
  // Σ planned line amounts
  allocated: number
  spend: number
  save: number
  // income − allocated; negative when the plan gives away more than comes in
  leftover: number
  // Σ actual amounts, counting a line without one as its planned amount
  actualAllocated: number
  actualLeftover: number
  // How many lines have an actual amount
  checked: number
  lineCount: number
}

export function planTotals (
  incomes: IncomeLike[],
  lines: LineLike[]
): PlanTotals {
  const income = planIncome(incomes)
  const totals = lines.reduce(
    (acc, line) => {
      const planned = lineAmount(line, income)
      acc.allocated += planned
      acc[line.flow] += planned
      acc.actualAllocated += line.actual_amount ?? planned
      if (line.actual_amount !== null) acc.checked += 1
      return acc
    },
    { allocated: 0, spend: 0, save: 0, actualAllocated: 0, checked: 0 }
  )
  return {
    income,
    ...totals,
    leftover: income - totals.allocated,
    actualLeftover: income - totals.actualAllocated,
    lineCount: lines.length
  }
}

// ─── Checkpoint ─────────────────────────────────────────────────────────────

export type LineStatus = 'open' | 'under' | 'on' | 'over'

// Within 1% (and at least half a unit) of the plan counts as on plan
export function lineStatus (line: LineLike, income: number): LineStatus {
  if (line.actual_amount === null) return 'open'
  const planned = lineAmount(line, income)
  const tolerance = Math.max(0.5, Math.abs(planned) * 0.01)
  const diff = line.actual_amount - planned
  if (Math.abs(diff) <= tolerance) return 'on'
  return diff < 0 ? 'under' : 'over'
}

// Whether a status is good news: spending less or saving more than planned
export function isFavourable (status: LineStatus, flow: PlanLineFlow) {
  if (status === 'on') return true
  if (status === 'open') return null
  return flow === 'spend' ? status === 'under' : status === 'over'
}

// ─── New month ──────────────────────────────────────────────────────────────

// Incomes and lines to start a new month from: same labels, amounts and
// rates, no actuals (the checkpoint is per month)
export function copyForNewMonth (prev: Pick<MonthlyPlan, 'incomes' | 'lines'>): {
  incomes: CreatePlanIncomeDTO[]
  lines: CreatePlanLineDTO[]
} {
  return {
    incomes: (prev.incomes ?? []).map((income, index) => ({
      label: income.label,
      currency: income.currency,
      amount: income.amount,
      rate: income.rate,
      rate_source: income.rate_source,
      converted_amount: income.converted_amount,
      sort_order: index
    })),
    lines: (prev.lines ?? []).map((line, index) => ({
      label: line.label,
      kind: line.kind,
      value: line.value,
      flow: line.flow,
      actual_amount: null,
      sort_order: index
    }))
  }
}

// ─── Projection ─────────────────────────────────────────────────────────────

export const LEFTOVER_KEY = 'leftover'

export interface ProjectionSeries {
  key: string
  label: string
  flow: PlanLineFlow
  monthly: number
}

export interface ProjectionRow {
  // 1-based: the total after this many months
  index: number
  // 'yyyy-MM-01' of the month this row ends with
  month: string
  values: Record<string, number>
}

// The series a plan can project: each line (keyed by its position) and the
// leftover, which is kept like savings
export function projectionSeries (plan: {
  incomes?: IncomeLike[]
  lines?: (LineLike & Partial<Pick<PlanLine, 'label'>>)[]
}): ProjectionSeries[] {
  const income = planIncome(plan.incomes ?? [])
  const lines = plan.lines ?? []
  const { leftover } = planTotals(plan.incomes ?? [], lines)
  return [
    ...lines.map((line, index) => ({
      key: `line-${index}`,
      label: line.label ?? '',
      flow: line.flow,
      monthly: lineAmount(line, income)
    })),
    { key: LEFTOVER_KEY, label: '', flow: 'save' as const, monthly: leftover }
  ]
}

// Running totals if the same plan repeats every month, starting with `start`
export function project (
  series: ProjectionSeries[],
  start: string,
  months: number
): ProjectionRow[] {
  return Array.from({ length: months }, (_, i) => ({
    index: i + 1,
    month: addMonths(start, i),
    values: Object.fromEntries(
      series.map(item => [item.key, item.monthly * (i + 1)])
    )
  }))
}
