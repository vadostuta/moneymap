'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home () {
  const router = useRouter()

  useEffect(() => {
    router.push('/start')
  }, [router])

  return (
    <main className='flex min-h-screen mt-[-5rem] flex-col items-center justify-center p-24 w-full'>
      <div className='text-center max-w-4xl mx-auto flex flex-col items-center w-full'>
        <div className='flex items-center gap-4 mb-6'>
          <svg
            width='60'
            height='60'
            viewBox='0 0 200 200'
            xmlns='http://www.w3.org/2000/svg'
            className='text-primary'
          >
            {/* Pie Chart Segments */}
            <circle cx='100' cy='100' r='70' fill='currentColor' />
            <path
              d='M100,30 A70,70 0 0,1 170,100 L140,100 A40,40 0 0,0 100,60 Z'
              fill='#57C6E1'
            />
            <path
              d='M170,100 A70,70 0 0,1 100,170 L100,140 A40,40 0 0,0 140,100 Z'
              fill='#4DA3FF'
            />
            <path
              d='M100,170 A70,70 0 0,1 30,100 L60,100 A40,40 0 0,0 100,140 Z'
              fill='#FF6B6B'
            />
            <path
              d='M30,100 A70,70 0 0,1 100,30 L100,60 A40,40 0 0,0 60,100 Z'
              fill='#FFD93D'
            />
            {/* Inner Circle (White Center) */}
            <circle cx='100' cy='100' r='40' fill='#fff' />
          </svg>

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
