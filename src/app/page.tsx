'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home () {
  const router = useRouter()

  useEffect(() => {
    router.push('/start')
  }, [router])

  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-24'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
        <p>Redirecting to start page...</p>
      </div>
    </main>
  )
}
