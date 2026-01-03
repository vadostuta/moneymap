'use client'

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import Image from 'next/image'
import { Logo } from '@/components/ui/Logo'

export function AboutClient () {
  const { t } = useTranslation('common')
  const { user } = useAuth()

  const features = [
    {
      title: t('about.features.monobank.title'),
      description: t('about.features.monobank.description'),
      details: t('about.features.monobank.details'),
      icon: '🏦',
      color: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20'
    },
    {
      title: t('about.features.templates.title'),
      description: t('about.features.templates.description'),
      details: t('about.features.templates.details'),
      icon: '📋',
      color: 'from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20'
    },
    {
      title: t('about.features.search.title'),
      description: t('about.features.search.description'),
      details: t('about.features.search.details'),
      icon: '🔍',
      color: 'from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20'
    },
    {
      title: t('about.features.wallets.title'),
      description: t('about.features.wallets.description'),
      details: t('about.features.wallets.details'),
      icon: '💼',
      color: 'from-orange-500/10 to-amber-500/10 dark:from-orange-500/20 dark:to-amber-500/20'
    },
    {
      title: t('about.features.visualize.title'),
      description: t('about.features.visualize.description'),
      details: t('about.features.visualize.details'),
      icon: '📊',
      color: 'from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20'
    }
  ]

  const screenshots = [
    {
      src: '/preview-images/dashboard.png',
      alt: 'MoneyMap Dashboard',
      title: 'Beautiful Dashboard',
      description: 'Get a complete overview of your finances at a glance'
    },
    {
      src: '/preview-images/transactions.png',
      alt: 'Transaction Management',
      title: 'Smart Transactions',
      description: 'Organize and categorize your expenses effortlessly'
    },
    {
      src: '/preview-images/templates.png',
      alt: 'Custom Templates',
      title: 'Flexible Templates',
      description: 'Create personalized views that fit your workflow'
    }
  ]

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-background'>
      <div className='max-w-6xl mx-auto px-6 py-12'>
        {/* Back button */}
        <div className='mb-8'>
          <Button asChild variant='ghost' size='sm' className='hover:bg-slate-100 dark:hover:bg-slate-800'>
            <Link href='/' className='flex items-center gap-2'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
              </svg>
              Back
            </Link>
          </Button>
        </div>

        {/* Hero Section */}
        <div className='text-center mb-16'>
          <div className='inline-flex items-center gap-4 mb-6'>
            <Logo size='xl' />
            <h1 className='text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent'>
              MoneyMap
            </h1>
          </div>
          <p className='text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-4'>
            {t('about.hero.description')}
          </p>
          <p className='text-base text-slate-500 dark:text-slate-500 max-w-xl mx-auto'>
            {t('about.hero.subtitle')}
          </p>
        </div>

        {/* Screenshots Showcase */}
        <div className='mb-20'>
          <h2 className='text-3xl font-bold text-center text-slate-900 dark:text-slate-100 mb-12'>
            See It In Action
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {screenshots.map((screenshot) => (
              <div key={screenshot.src} className='group relative'>
                <div className='relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full'>
                  <div className='aspect-video relative bg-slate-100 dark:bg-slate-800'>
                    <Image
                      src={screenshot.src}
                      alt={screenshot.alt}
                      fill
                      className='object-cover'
                      sizes='(max-width: 768px) 100vw, 33vw'
                    />
                  </div>
                  <div className='p-4 flex-1 flex flex-col'>
                    <h3 className='font-semibold text-slate-900 dark:text-slate-100 mb-1'>
                      {screenshot.title}
                    </h3>
                    <p className='text-sm text-slate-600 dark:text-slate-400'>
                      {screenshot.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className='mb-20'>
          <h2 className='text-3xl font-bold text-center text-slate-900 dark:text-slate-100 mb-12'>
            {t('about.features.title')}
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {features.map((feature) => (
              <div
                key={feature.title}
                className='group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1'
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className='relative'>
                  <div className='text-4xl mb-4'>{feature.icon}</div>
                  <h3 className='text-lg font-bold text-slate-900 dark:text-slate-100 mb-3'>
                    {feature.title}
                  </h3>
                  <p className='text-slate-700 dark:text-slate-300 mb-2 text-sm leading-relaxed'>
                    {feature.description}
                  </p>
                  <p className='text-slate-500 dark:text-slate-500 text-xs leading-relaxed'>
                    {feature.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        {!user && (
          <div className='text-center py-16 px-8 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl'>
            <h2 className='text-3xl font-bold text-white mb-4'>
              {t('about.cta.title')}
            </h2>
            <p className='text-blue-100 text-lg mb-8 max-w-2xl mx-auto'>
              {t('about.cta.description')}
            </p>
            <Button
              asChild
              size='lg'
              className='bg-white text-purple-600 hover:bg-slate-100 px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all'
            >
              <Link href='/start'>{t('about.cta.start')}</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
