import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  commitPendingMethod,
  getLastUsername,
  getLastMethod,
  markPendingMethod
} from './last-method'

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k)
  })
})

describe('last auth method', () => {
  it('only becomes "last used" after the sign-in is committed', () => {
    markPendingMethod('password', 'vadym')
    expect(getLastMethod()).toBeNull()
    expect(getLastUsername()).toBe('vadym')

    expect(commitPendingMethod()).toBe('password')
    expect(getLastMethod()).toBe('password')
  })

  it('keeps the previous method when a new attempt is never completed', () => {
    markPendingMethod('google')
    commitPendingMethod()
    markPendingMethod('password', 'vadym')
    expect(getLastMethod()).toBe('google')
  })

  it('ignores commits without a pending attempt', () => {
    expect(commitPendingMethod()).toBeNull()
    expect(getLastMethod()).toBeNull()
  })

  it('survives unavailable storage', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') }
    })
    expect(() => markPendingMethod('google')).not.toThrow()
    expect(getLastMethod()).toBeNull()
    expect(getLastUsername()).toBe('')
  })
})
