import { describe, expect, it } from 'vitest'
import {
  OTHER_COLOR,
  SERIES_COUNT,
  assignSeriesColors,
  preferredColor,
  preferredSlot
} from './chart-colors'

const ids = Array.from({ length: 12 }, (_, i) => `category-${i}`)

describe('preferredSlot', () => {
  it('is stable and inside the palette', () => {
    for (const id of ids) {
      const slot = preferredSlot(id)
      expect(slot).toBe(preferredSlot(id))
      expect(slot).toBeGreaterThanOrEqual(0)
      expect(slot).toBeLessThan(SERIES_COUNT)
    }
  })
})

describe('assignSeriesColors', () => {
  it('gives a lone id its preferred colour', () => {
    expect(assignSeriesColors(['a']).get('a')).toBe(preferredColor('a'))
  })

  it('keeps an id on its colour whatever else is in the chart', () => {
    // The biggest category never moves, however the month's mix changes
    const big = ids[0]
    const monthA = assignSeriesColors([big, ids[1], ids[2]])
    const monthB = assignSeriesColors([big, ids[5], ids[9], ids[3]])
    expect(monthA.get(big)).toBe(monthB.get(big))
  })

  it('never gives two ids the same colour within the first eight', () => {
    const colors = assignSeriesColors(ids.slice(0, SERIES_COUNT))
    expect(new Set(colors.values()).size).toBe(SERIES_COUNT)
  })

  it('folds everything past the limit into the Other colour', () => {
    const colors = assignSeriesColors(ids, 7)
    const coloured = ids.filter(id => colors.get(id) !== OTHER_COLOR)
    expect(coloured).toEqual(ids.slice(0, 7))
  })

  it('ignores repeated ids', () => {
    const colors = assignSeriesColors(['a', 'a', 'b'])
    expect(colors.size).toBe(2)
    expect(colors.get('a')).not.toBe(colors.get('b'))
  })
})
