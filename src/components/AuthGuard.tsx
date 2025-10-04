'use client'

import { useAuth } from '@/contexts/auth-context'

export function AuthGuard ({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  if (!user) {
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

            <h1 className='text-4xl font-bold text-foreground'>
              Welcome to MoneyMap
            </h1>
          </div>

          <p className='text-lg text-muted-foreground'>
            Please sign in to start using our app
          </p>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
