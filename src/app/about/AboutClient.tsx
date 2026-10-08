'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Check,
  Coins,
  EyeOff,
  KeyRound,
  Languages,
  LayoutDashboard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { GrowPreview, HeroPreview, PlanPreview, TrackPreview } from './previews'

function Story ({
  id,
  section,
  points,
  visual,
  reverse = false
}: {
  id: string
  section: 'track' | 'plan' | 'grow'
  points: string[]
  visual: React.ReactNode
  reverse?: boolean
}) {
  const { t } = useTranslation('common')

  return (
    <section
      id={id}
      className='grid scroll-mt-8 items-center gap-10 md:grid-cols-2 md:gap-16'
    >
      <div className={cn(reverse && 'md:order-2')}>
        <p className='mb-3 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--chart-1))]'>
          {t(`about.${section}.eyebrow`)}
        </p>
        <h2 className='mb-4 text-3xl font-bold tracking-tight sm:text-4xl'>
          {t(`about.${section}.title`)}
        </h2>
        <p className='mb-6 text-lg leading-relaxed text-muted-foreground'>
          {t(`about.${section}.description`)}
        </p>
        <ul className='space-y-3'>
          {points.map(point => (
            <li key={point} className='flex items-start gap-3'>
              <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[hsl(var(--chart-1)/0.12)]'>
                <Check className='h-3 w-3 text-[hsl(var(--chart-1))]' />
              </span>
              <span>{t(`about.${section}.points.${point}`)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={cn(reverse && 'md:order-1')}>{visual}</div>
    </section>
  )
}

const MORE_FEATURES = [
  { key: 'templates', icon: LayoutDashboard },
  { key: 'analytics', icon: BarChart3 },
  { key: 'currencies', icon: Coins },
  { key: 'privacyMode', icon: EyeOff },
  { key: 'languages', icon: Languages },
  { key: 'signIn', icon: KeyRound }
]

export function AboutClient () {
  const { t } = useTranslation('common')
  const { user } = useAuth()

  const primaryCta = user
    ? { href: '/start', label: t('about.hero.openApp') }
    : { href: '/login', label: t('about.hero.getStarted') }

  return (
    <div className='relative min-h-screen overflow-hidden bg-background'>
      {/* Soft glow behind the hero */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_at_top,hsl(var(--chart-1)/0.14),transparent_65%)]'
      />

      <div className='relative mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6 sm:pt-20'>
        {/* Hero */}
        <section className='mx-auto max-w-3xl text-center'>
          <div className='mb-6 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-sm text-muted-foreground backdrop-blur'>
            <Logo size='sm' />
            {t('about.hero.eyebrow')}
          </div>
          <h1 className='text-4xl font-bold tracking-tight sm:text-6xl'>
            {t('about.hero.title')}
          </h1>
          <p className='mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground'>
            {t('about.hero.description')}
          </p>
          <div className='mt-8 flex flex-col justify-center gap-3 sm:flex-row'>
            <Button asChild size='lg' className='gap-2'>
              <Link href={primaryCta.href}>
                {primaryCta.label}
                <ArrowRight className='h-4 w-4' />
              </Link>
            </Button>
            <Button asChild size='lg' variant='outline'>
              <a href='#track'>{t('about.hero.seeFeatures')}</a>
            </Button>
          </div>
        </section>

        <div className='mx-auto mt-14 max-w-4xl sm:mt-20'>
          <HeroPreview />
        </div>

        {/* Feature stories */}
        <div className='mt-24 space-y-24 sm:mt-32 sm:space-y-32'>
          <Story
            id='track'
            section='track'
            points={['sync', 'import', 'wallets', 'search']}
            visual={<TrackPreview />}
          />
          <Story
            id='plan'
            section='plan'
            points={['lines', 'checkpoint', 'projection']}
            visual={<PlanPreview />}
            reverse
          />
          <Story
            id='grow'
            section='grow'
            points={['snapshots', 'claims', 'goals']}
            visual={<GrowPreview />}
          />
        </div>

        {/* Smaller features */}
        <section className='mt-24 sm:mt-32'>
          <h2 className='mb-10 text-center text-3xl font-bold tracking-tight'>
            {t('about.more.title')}
          </h2>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {MORE_FEATURES.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className='rounded-2xl border bg-card p-6 transition-colors hover:border-[hsl(var(--chart-1)/0.4)]'
              >
                <span className='mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted'>
                  <Icon className='h-5 w-5' />
                </span>
                <h3 className='mb-1.5 font-semibold'>
                  {t(`about.more.${key}.title`)}
                </h3>
                <p className='text-sm leading-relaxed text-muted-foreground'>
                  {t(`about.more.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing call to action */}
        {!user && (
          <section className='mt-24 rounded-3xl border bg-muted/40 px-6 py-14 text-center sm:mt-32 sm:px-12'>
            <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
              {t('about.cta.title')}
            </h2>
            <p className='mx-auto mt-4 max-w-xl text-lg text-muted-foreground'>
              {t('about.cta.description')}
            </p>
            <Button asChild size='lg' className='mt-8 gap-2'>
              <Link href='/login'>
                {t('about.cta.button')}
                <ArrowRight className='h-4 w-4' />
              </Link>
            </Button>
          </section>
        )}
      </div>
    </div>
  )
}
