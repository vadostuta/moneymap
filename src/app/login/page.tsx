'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/ui/Logo'
import { AuthError } from '@supabase/supabase-js'
import { AuthMethod, getLastMethod, getLastUsername } from '@/lib/auth/last-method'
import { isValidUsername, normalizeUsername } from '@/lib/auth/username'

const MIN_PASSWORD_LENGTH = 8

// Supabase messages talk about emails; users only ever see a username
const AUTH_ERROR_KEYS: Record<string, string> = {
  invalid_credentials: 'auth.wrongCredentials',
  user_already_exists: 'auth.usernameTaken',
  email_exists: 'auth.usernameTaken'
}

function LastUsedBadge ({ onPrimary = false }: { onPrimary?: boolean }) {
  const { t } = useTranslation('common')
  return (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        onPrimary
          ? 'bg-primary-foreground/20 text-primary-foreground'
          : 'bg-primary/10 text-primary'
      }`}
    >
      {t('auth.lastUsed')}
    </span>
  )
}

function GoogleIcon () {
  return (
    <svg viewBox='0 0 24 24' className='h-4 w-4' aria-hidden='true'>
      <path
        fill='#4285F4'
        d='M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87z'
      />
      <path
        fill='#34A853'
        d='M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A11.99 11.99 0 0 0 12 24z'
      />
      <path
        fill='#FBBC05'
        d='M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62h-4a12 12 0 0 0 0 10.76l4-3.09z'
      />
      <path
        fill='#EA4335'
        d='M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.97 11.97 0 0 0 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75z'
      />
    </svg>
  )
}

function LoginContent () {
  const { t } = useTranslation('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    user,
    loading,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword
  } = useAuth()

  const [lastMethod, setLastMethod] = useState<AuthMethod | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const urlError = searchParams.get('error')
  const urlMessage = searchParams.get('message')

  // localStorage is only readable after mount
  useEffect(() => {
    setLastMethod(getLastMethod())
    setUsername(getLastUsername())
  }, [])

  useEffect(() => {
    if (!loading && user) router.replace('/start')
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const name = normalizeUsername(username)
    if (!isValidUsername(name)) {
      setFormError(t('auth.invalidUsername'))
      return
    }
    if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
      setFormError(t('auth.passwordTooShort'))
      return
    }

    setBusy(true)
    try {
      if (isSignUp) await signUpWithPassword(name, password)
      else await signInWithPassword(name, password)
    } catch (error) {
      const key = error instanceof AuthError && error.code && AUTH_ERROR_KEYS[error.code]
      setFormError(key ? t(key) : error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className='flex min-h-[80vh] w-full items-center justify-center p-4'>
      <div className='w-full max-w-sm space-y-6'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <Logo size='lg' />
          <h1 className='text-2xl font-bold text-foreground'>
            {t('auth.welcome')}
          </h1>
        </div>

        {urlError && (
          <div className='flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4'>
            <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-destructive' />
            <div>
              <p className='mb-1 text-sm font-medium text-destructive'>
                {t('auth.errorTitle')}
              </p>
              <p className='text-xs text-destructive/90'>
                {urlMessage || urlError}
              </p>
            </div>
          </div>
        )}

        <Button
          variant='outline'
          size='lg'
          className='w-full gap-2'
          onClick={signInWithGoogle}
          disabled={busy}
        >
          <GoogleIcon />
          {t('auth.continueWithGoogle')}
          {lastMethod === 'google' && <LastUsedBadge />}
        </Button>

        <div className='flex items-center gap-3 text-xs uppercase text-muted-foreground'>
          <div className='h-px flex-1 bg-border' />
          {t('auth.or')}
          <div className='h-px flex-1 bg-border' />
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='username'>{t('auth.username')}</Label>
            <Input
              id='username'
              autoComplete='username'
              autoCapitalize='none'
              spellCheck={false}
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            {isSignUp && (
              <p className='text-xs text-muted-foreground'>
                {t('auth.usernameHint')}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='password'>{t('auth.password')}</Label>
            <Input
              id='password'
              type='password'
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type='submit' className='w-full' disabled={busy}>
            {busy && <Loader2 className='h-4 w-4 animate-spin' />}
            {isSignUp ? t('auth.createAccount') : t('auth.signIn')}
            {!isSignUp && lastMethod === 'password' && <LastUsedBadge onPrimary />}
          </Button>
          <p className='text-center text-sm text-muted-foreground'>
            {isSignUp ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
            <button
              type='button'
              className='font-medium text-primary hover:underline'
              onClick={() => {
                setIsSignUp(!isSignUp)
                setFormError(null)
              }}
            >
              {isSignUp ? t('auth.signIn') : t('auth.signUp')}
            </button>
          </p>
        </form>

        {formError && (
          <p className='text-center text-sm text-destructive' role='alert'>
            {formError}
          </p>
        )}
      </div>
    </main>
  )
}

export default function LoginPage () {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
