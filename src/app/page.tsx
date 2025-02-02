'use client'

import { useAuth } from '@/contexts/auth-context'

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
      {user ? (
        <div className='text-center'>
          <h1 className='text-4xl font-bold'>Welcome, {user.email}!</h1>
          <p className='mt-4'>You`re signed in and ready to use MoneyMap</p>
        </div>
      ) : (
        <div className='text-center'>
          <h1 className='text-4xl font-bold'>Welcome to MoneyMap</h1>
          <p className='mt-4'>Please sign in to start tracking your finances</p>
        </div>
      )}
    </main>
  )
}
