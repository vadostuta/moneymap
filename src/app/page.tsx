'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home () {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/overview')
    }
  }, [user, loading, router])

  if (loading || user) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center p-24'>
        Loading...
      </main>
    )
  }

  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-24'>
      <h1 className='text-4xl font-bold mb-6'>Welcome to MoneyMap</h1>
      <p>Please sign in to get started</p>
    </main>
  )
}
