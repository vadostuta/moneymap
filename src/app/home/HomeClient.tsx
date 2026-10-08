'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  Camera,
  CheckCircle2
} from 'lucide-react'
import { planService } from '@/lib/services/plan'
import { wealthService } from '@/lib/services/wealth'
import { usePrivacy } from '@/contexts/privacy-context'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { currentMonth, monthToParam } from '../plan/plan'
import { formatMonth } from '../plan/format'
import { Attention, attentionItems } from './home'
import { HomeCards } from './cards'

export default function HomeClient () {
  const { t, i18n } = useTranslation('common')

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: planService.getAll
  })
  const { data: snapshots = [], isLoading: snapshotsLoading } = useQuery({
    queryKey: ['wealth-snapshots'],
    queryFn: wealthService.getAll
  })

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div>
        <h1 className='text-lg sm:text-xl md:text-2xl font-bold'>
          {t('home.title')}
        </h1>
        <p className='text-sm text-muted-foreground capitalize'>
          {formatMonth(currentMonth(), i18n.language)}
        </p>
      </div>

      <HomeCards />

      {!plansLoading && !snapshotsLoading && (
        <AttentionList items={attentionItems(plans, snapshots)} />
      )}
    </div>
  )
}

// ─── Needs attention ────────────────────────────────────────────────────────

function AttentionList ({ items }: { items: Attention[] }) {
  const { t, i18n } = useTranslation('common')
  const { formatBalance } = usePrivacy()

  const row = (item: Attention) => {
    switch (item.kind) {
      case 'checkpointDue':
        return {
          icon: CalendarClock,
          text: t('home.attention.checkpointDue', {
            month: formatMonth(item.month, i18n.language)
          }),
          href: `/plan/${monthToParam(item.month)}`
        }
      case 'noPlan':
        return {
          icon: CalendarPlus,
          text: t('home.attention.noPlan', {
            month: formatMonth(item.month, i18n.language)
          }),
          href: `/plan/${monthToParam(item.month)}`
        }
      case 'noSnapshot':
        return {
          icon: Camera,
          text: t('home.attention.noSnapshot'),
          href: '/wealth/new'
        }
      case 'staleSnapshot':
        return {
          icon: Camera,
          text: t('home.attention.staleSnapshot', { count: item.days }),
          href: '/wealth/new'
        }
      case 'overClaimed':
        return {
          icon: AlertTriangle,
          text: t('home.attention.overClaimed', {
            amount: formatBalance(item.amount, item.currency)
          }),
          href: '/wealth/distribution'
        }
    }
  }

  return (
    <section className='space-y-2'>
      <h2 className='text-sm font-medium text-muted-foreground'>
        {t('home.attention.title')}
      </h2>
      {items.length === 0 ? (
        <Card>
          <CardContent className='pt-5 flex items-center gap-2 text-sm text-muted-foreground'>
            <CheckCircle2 className='h-4 w-4 text-green-700 dark:text-green-400' />
            {t('home.attention.none')}
          </CardContent>
        </Card>
      ) : (
        <ul className='border rounded-lg divide-y'>
          {items.map(item => {
            const { icon: Icon, text, href } = row(item)
            return (
              <li key={`${item.kind}-${'month' in item ? item.month : ''}`}>
                <Link
                  href={href}
                  className='flex items-center gap-3 p-3 text-sm hover:bg-accent/40 transition-colors'
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      item.kind === 'overClaimed'
                        ? 'text-destructive'
                        : 'text-amber-700 dark:text-amber-400'
                    )}
                  />
                  <span className='flex-1 first-letter:uppercase'>{text}</span>
                  <ArrowRight className='h-4 w-4 text-muted-foreground' />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
