'use client'

import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from 'react-i18next'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function AuthGuard ({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { t } = useTranslation('common')
  const pathname = usePathname()

  // Allow access to about page without authentication
  if (pathname === '/about') {
    return <>{children}</>
  }

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

          <p className='text-lg text-muted-foreground mb-6'>
            Please sign in to start using our app
          </p>

          {/* About link for non-signed-in users */}
          <div className='mb-6'>
            <Link
              href='/about'
              className='group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-sm font-medium text-primary hover:from-primary/20 hover:to-primary/10 hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 transition-all duration-300 hover:scale-105'
            >
              <svg
                className='w-4 h-4 group-hover:rotate-12 transition-transform duration-300'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              {t('navigation.about')}
              <svg
                className='w-3 h-3 group-hover:translate-x-1 transition-transform duration-300'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
