import type { User } from '@supabase/supabase-js'

// Supabase Auth only knows emails, so a username is stored as a
// placeholder address on a domain that never receives mail.
// "Confirm email" must stay off, or Supabase will try to mail it.
const USERNAME_DOMAIN = 'users.moneymap.local'

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,29}$/

export const normalizeUsername = (value: string) => value.trim().toLowerCase()

export const isValidUsername = (value: string) => USERNAME_PATTERN.test(value)

export const usernameToEmail = (username: string) =>
  `${username}@${USERNAME_DOMAIN}`

// Username accounts show their username, Google accounts their email
export const displayName = (user: User): string => {
  const email = user.email ?? ''
  return email.endsWith(`@${USERNAME_DOMAIN}`)
    ? email.slice(0, -USERNAME_DOMAIN.length - 1)
    : email
}
