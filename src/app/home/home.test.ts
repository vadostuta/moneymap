import { describe, expect, it } from 'vitest'
import { dailyCumulative, spendPace } from './home'

// 10 October 2026: a 31-day month
const today = new Date(2026, 9, 10)

describe('dailyCumulative', () => {
  const byDay = Array(31).fill(0)
  byDay[0] = 100
  byDay[4] = 50
  byDay[9] = 25

  it('has one row per day of the month', () => {
    const rows = dailyCumulative(byDay, 3100, today)
    expect(rows).toHaveLength(31)
    expect(rows[0].day).toBe(1)
    expect(rows[30].day).toBe(31)
  })

  it('adds up spending and stops at today', () => {
    const rows = dailyCumulative(byDay, 3100, today)
    expect(rows[0].spent).toBe(100)
    expect(rows[3].spent).toBe(100)
    expect(rows[4].spent).toBe(150)
    expect(rows[9].spent).toBe(175)
    expect(rows[10].spent).toBeNull()
    expect(rows[30].spent).toBeNull()
  })

  it('reaches the planned amount on the last day', () => {
    const rows = dailyCumulative(byDay, 3100, today)
    expect(rows[0].pace).toBe(100)
    expect(rows[30].pace).toBe(3100)
  })

  it('has no pace without a plan', () => {
    const rows = dailyCumulative(byDay, null, today)
    expect(rows.every(row => row.pace === null)).toBe(true)
    expect(rows[9].spent).toBe(175)
  })
})

describe('spendPace', () => {
  it('compares spending with an even pace by today', () => {
    const pace = spendPace(3100, 1200, today)
    expect(pace.elapsed).toBeCloseTo(10 / 31)
    expect(pace.expected).toBeCloseTo(1000)
    expect(pace.ahead).toBeCloseTo(200)
  })
})
