'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header () {
  const { user, signInWithGoogle, signOut } = useAuth()
  const pathname = usePathname()

  return (
    <header className='border-b'>
      <div className='container flex h-16 items-center justify-between'>
        <div className='flex items-center gap-8'>
          <Link
            href='/'
            className='font-bold hover:text-primary transition-colors'
          >
            MoneyMap
          </Link>
          {user && (
            <nav className='flex gap-4'>
              <Link
                href='/wallets'
                className={`hover:text-primary transition-colors ${
                  pathname === '/wallets'
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                Wallets
              </Link>
              {/* Add more nav links here as needed */}
            </nav>
          )}
        </div>
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
