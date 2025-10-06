'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Logo } from '@/components/ui/Logo'

export default function Home () {
  const router = useRouter()

  useEffect(() => {
    router.push('/start')
  }, [router])

  return (
    <main className='flex min-h-screen mt-[-5rem] flex-col items-center justify-center p-24 w-full'>
      <div className='text-center max-w-4xl mx-auto flex flex-col items-center w-full'>
        <div className='flex items-center gap-4 mb-6'>
          <Logo size='lg' />

          <h1 className='text-4xl font-bold text-foreground'>MoneyMap</h1>
        </div>

        <div className='flex items-center gap-4'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          <p className='text-lg text-muted-foreground'>
            Redirecting to start page...
          </p>
        </div>
      </div>
    </main>
  )
}
