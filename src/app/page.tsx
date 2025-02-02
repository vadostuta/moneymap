'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home () {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center p-24'>
        Loading...
      </main>
    )
  }

  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-24'>
      <h1 className='text-4xl font-bold mb-6'>Welcome to MoneyMap</h1>
      {user ? (
        <div className='text-center'>
          <p className='mb-4'>Start managing your finances</p>
          <Button asChild>
            <Link href='/wallets'>Go to Wallets</Link>
          </Button>
        </div>
      ) : (
        <p>Please sign in to get started</p>
      )}
    </main>
  )
}
