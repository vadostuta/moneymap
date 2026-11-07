// Colours for categorical charts (spending by category, expenses by wallet).
//
// The palette is the eight --series-N tokens in globals.css. A colour follows
// the thing it stands for, not its rank: each category hashes to a preferred
// slot, so Groceries stays the same colour from one month to the next. When
// two things in one chart want the same slot, the bigger one keeps it and the
// other takes the next free slot. Past eight, everything shares OTHER_COLOR —
// a ninth colour would be too close to one of the eight to tell apart.

export const SERIES_COUNT = 8

export const OTHER_COLOR = 'hsl(var(--muted-foreground))'

export const seriesColor = (slot: number) => `hsl(var(--series-${slot + 1}))`

// FNV-1a: cheap, stable across sessions and browsers
export function preferredSlot (id: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0) % SERIES_COUNT
}

// The colour an id gets when nothing else competes for its slot
export const preferredColor = (id: string) => seriesColor(preferredSlot(id))

/**
 * Colours for the ids in one chart. Pass them biggest first: the biggest
 * keep their preferred colour when two collide, and everything after the
 * first `limit` gets OTHER_COLOR.
 */
export function assignSeriesColors (
  idsBiggestFirst: string[],
  limit: number = SERIES_COUNT
): Map<string, string> {
  const colors = new Map<string, string>()
  const taken = new Set<number>()

  for (const id of idsBiggestFirst) {
    if (colors.has(id)) continue
    if (taken.size >= Math.min(limit, SERIES_COUNT)) {
      colors.set(id, OTHER_COLOR)
      continue
    }
    let slot = preferredSlot(id)
    while (taken.has(slot)) slot = (slot + 1) % SERIES_COUNT
    taken.add(slot)
    colors.set(id, seriesColor(slot))
  }

  return colors
}
