'use client'

import { useAuth } from '@/contexts/auth-context'

export function AuthGuard ({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className='flex flex-col items-center justify-center h-full'>
        <h1 className='text-2xl font-bold mb-4'>Welcome to MoneyMap</h1>
        <p className='text-gray-600'>Please sign in to start using our app</p>
      </div>
    )
  }

  return <>{children}</>
}
