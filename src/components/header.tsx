'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

export function Header () {
  const { user, signInWithGoogle, signOut } = useAuth()

  return (
    <header className='border-b'>
      <div className='container flex h-16 items-center justify-between'>
        <div className='font-bold'>MoneyMap</div>
        <div>
          {user ? (
            <div className='flex items-center gap-4'>
              <span>{user.email}</span>
              <Button variant='outline' onClick={signOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Button onClick={signInWithGoogle}>Sign In with Google</Button>
          )}
        </div>
      </div>
    </header>
  )
}
