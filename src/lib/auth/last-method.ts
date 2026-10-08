export type AuthMethod = 'google' | 'password'

const PENDING_KEY = 'moneymap:auth-pending-method'
const LAST_KEY = 'moneymap:auth-last-method'
const LOGIN_KEY = 'moneymap:auth-last-username'

const METHODS: AuthMethod[] = ['google', 'password']

const isAuthMethod = (value: string | null): value is AuthMethod =>
  value !== null && (METHODS as string[]).includes(value)

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable (private mode, blocked site data)
  }
}

// Called right before a sign-in attempt. OAuth leaves the page, so the
// method is only promoted to "last used" once SIGNED_IN fires.
export const markPendingMethod = (method: AuthMethod, username?: string) => {
  write(PENDING_KEY, method)
  if (username) write(LOGIN_KEY, username)
}

export const commitPendingMethod = (): AuthMethod | null => {
  const pending = read(PENDING_KEY)
  if (!isAuthMethod(pending)) return null
  write(LAST_KEY, pending)
  write(PENDING_KEY, null)
  return pending
}

export const getLastMethod = (): AuthMethod | null => {
  const last = read(LAST_KEY)
  return isAuthMethod(last) ? last : null
}

export const getLastUsername = (): string => read(LOGIN_KEY) ?? ''
