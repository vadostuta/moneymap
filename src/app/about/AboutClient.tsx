'use client'

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'

export function AboutClient () {
  const { t } = useTranslation('common')

  const { user } = useAuth()

  const features = [
    {
      title: t('about.features.monobank.title'),
      description: t('about.features.monobank.description'),
      details: t('about.features.monobank.details')
    },
    {
      title: t('about.features.templates.title'),
      description: t('about.features.templates.description'),
      details: t('about.features.templates.details')
    },
    {
      title: t('about.features.search.title'),
      description: t('about.features.search.description'),
      details: t('about.features.search.details')
    },
    {
      title: t('about.features.wallets.title'),
      description: t('about.features.wallets.description'),
      details: t('about.features.wallets.details')
    },
    {
      title: t('about.features.visualize.title'),
      description: t('about.features.visualize.description'),
      details: t('about.features.visualize.details')
    }
  ]

  return (
    <div className='min-h-screen bg-white dark:bg-background'>
      <div className='max-w-4xl mx-auto px-6 py-12'>
        {/* Back button */}
        <div className='mb-8'>
          <Button asChild variant='outline' size='sm'>
            <Link href='/' className='flex items-center gap-2'>
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M10 19l-7-7m0 0l7-7m-7 7h18'
                />
              </svg>
              Back
            </Link>
          </Button>
        </div>
        {/* Document Header */}
        <div className='mb-12'>
          <h1 className='text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6 leading-tight'>
            MoneyMap
          </h1>
          <div className='prose prose-lg max-w-none'>
            <p className='text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-4'>
              {t('about.hero.description')}
            </p>
            <p className='text-base text-slate-600 dark:text-slate-400 leading-relaxed'>
              {t('about.hero.subtitle')}
            </p>
          </div>
        </div>

        {/* Document Content */}
        <div className='prose prose-lg max-w-none'>
          <h2 className='text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-8 border-b border-slate-200 dark:border-slate-700 pb-2'>
            {t('about.features.title')}
          </h2>

          <div className='space-y-10'>
            {features.map((feature, index) => (
              <div key={index} className='not-prose'>
                <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 leading-snug'>
                  {feature.title}
                </h3>
                <p className='text-slate-700 dark:text-slate-300 leading-relaxed mb-2 text-base'>
                  {feature.description}
                </p>
                <p className='text-slate-600 dark:text-slate-400 leading-relaxed text-sm'>
                  {feature.details}
                </p>
              </div>
            ))}
          </div>

          {/* Document Footer */}
          {!user && (
            <div className='mt-16 pt-8 border-t border-slate-200 dark:border-slate-700'>
              <h2 className='text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6'>
                {t('about.cta.title')}
              </h2>
              <p className='text-slate-700 dark:text-slate-300 leading-relaxed mb-8 text-base'>
                {t('about.cta.description')}
              </p>
              <div className='text-center'>
                <Button asChild size='lg' className='px-6 py-2 text-base'>
                  <Link href='/start'>{t('about.cta.start')}</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
