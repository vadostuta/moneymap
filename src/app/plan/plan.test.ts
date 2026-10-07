import { describe, expect, it } from 'vitest'
import {
  LEFTOVER_KEY,
  addMonths,
  copyForNewMonth,
  isFavourable,
  lineAmount,
  lineStatus,
  monthFromParam,
  nextMonthToPlan,
  planTotals,
  previousPlan,
  project,
  projectionSeries
} from './plan'

const salary = { converted_amount: 3000 }
const line = (
  kind: 'fixed' | 'percent',
  value: number,
  flow: 'spend' | 'save' = 'spend',
  actual_amount: number | null = null
) => ({ kind, value, flow, actual_amount })

// The example from the plan: €3000 salary, rent 800, me 10%, groceries 400,
// investments 15%
const october = {
  incomes: [salary],
  lines: [
    line('fixed', 800),
    line('percent', 10),
    line('fixed', 400),
    line('percent', 15, 'save')
  ]
}

describe('months', () => {
  it('adds months across years', () => {
    expect(addMonths('2026-10-01', 3)).toBe('2027-01-01')
    expect(addMonths('2026-01-01', -1)).toBe('2025-12-01')
  })

  it('parses URL months', () => {
    expect(monthFromParam('2026-10')).toBe('2026-10-01')
    expect(monthFromParam('2026-13')).toBeNull()
    expect(monthFromParam('october')).toBeNull()
  })

  it('opens this month first, then the month after the latest plan', () => {
    const today = new Date(2026, 9, 7)
    expect(nextMonthToPlan([], today)).toBe('2026-10-01')
    expect(nextMonthToPlan([{ month: '2026-09-01' }], today)).toBe('2026-10-01')
    expect(
      nextMonthToPlan([{ month: '2026-10-01' }, { month: '2026-11-01' }], today)
    ).toBe('2026-12-01')
  })

  it('copies from the latest plan before the month', () => {
    const plans = [{ month: '2026-08-01' }, { month: '2026-10-01' }]
    expect(previousPlan(plans, '2026-09-01')?.month).toBe('2026-08-01')
    expect(previousPlan(plans, '2026-07-01')?.month).toBe('2026-10-01')
    expect(previousPlan([], '2026-07-01')).toBeNull()
  })
})

describe('amounts', () => {
  it('takes percentages of total income', () => {
    expect(lineAmount(line('percent', 15), 3000)).toBe(450)
    expect(lineAmount(line('fixed', 800), 3000)).toBe(800)
  })

  it('computes the leftover', () => {
    const totals = planTotals(october.incomes, october.lines)
    expect(totals.income).toBe(3000)
    expect(totals.allocated).toBe(800 + 300 + 400 + 450)
    expect(totals.spend).toBe(1500)
    expect(totals.save).toBe(450)
    expect(totals.leftover).toBe(1050)
  })

  it('allows a negative leftover', () => {
    expect(planTotals([salary], [line('fixed', 3500)]).leftover).toBe(-500)
  })

  it('counts unchecked lines at their planned amount', () => {
    const totals = planTotals(
      [salary],
      [line('fixed', 800, 'spend', 900), line('percent', 10)]
    )
    expect(totals.actualAllocated).toBe(900 + 300)
    expect(totals.actualLeftover).toBe(1800)
    expect(totals.checked).toBe(1)
  })
})

describe('checkpoint', () => {
  it('derives a status from the actual amount', () => {
    expect(lineStatus(line('fixed', 400), 3000)).toBe('open')
    expect(lineStatus(line('fixed', 400, 'spend', 402), 3000)).toBe('on')
    expect(lineStatus(line('fixed', 400, 'spend', 350), 3000)).toBe('under')
    expect(lineStatus(line('percent', 10, 'spend', 350), 3000)).toBe('over')
  })

  it('treats spending less and saving more as good', () => {
    expect(isFavourable('under', 'spend')).toBe(true)
    expect(isFavourable('under', 'save')).toBe(false)
    expect(isFavourable('over', 'save')).toBe(true)
    expect(isFavourable('open', 'save')).toBeNull()
  })

  it('starts a new month without actuals', () => {
    const copy = copyForNewMonth({
      incomes: [
        {
          id: 'i', user_id: 'u', plan_id: 'p', label: 'Salary', currency: 'EUR',
          amount: 3000, rate: 1, rate_source: null, converted_amount: 3000,
          sort_order: 4, created_at: ''
        }
      ],
      lines: [
        {
          id: 'l', user_id: 'u', plan_id: 'p', label: 'Rent', kind: 'fixed',
          value: 800, flow: 'spend', actual_amount: 820, sort_order: 2,
          created_at: ''
        }
      ]
    })
    expect(copy.incomes[0]).toMatchObject({ label: 'Salary', amount: 3000, sort_order: 0 })
    expect(copy.lines[0]).toMatchObject({ label: 'Rent', actual_amount: null, sort_order: 0 })
  })
})

describe('projection', () => {
  it('accumulates a line over the range', () => {
    const series = projectionSeries(october)
    const rows = project(series, '2026-10-01', 12)
    expect(rows).toHaveLength(12)
    expect(rows[0].values['line-3']).toBe(450)
    expect(rows[11].values['line-3']).toBe(5400)
    expect(rows[11].month).toBe('2027-09-01')
    expect(rows[11].values[LEFTOVER_KEY]).toBe(1050 * 12)
  })
})
