'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWallet } from '@/contexts/wallet-context'
import { Card, CardContent } from '@/components/ui/card'
import { ExpensePieChart } from '@/components/ui/ExpensePieChart'
import { RecentTransactions } from '@/components/transaction/RecentTransactions'
import { currentMonth } from '../plan/plan'
import { formatMonth } from '../plan/format'
import { HomeCards, useMonthSpending } from '../home/cards'
import { dailyCumulative } from '../home/home'
import { DailySpendChart } from './DailySpendChart'

// One fixed screen: the three headline numbers, then this month's spending
export default function DashboardClient () {
  const { t, i18n } = useTranslation('common')
  const { selectedWallet } = useWallet()
  // Clicking a pie slice filters the transactions next to it
  const [category, setCategory] = useState<string | undefined>()
  // The pie chart's ‹ › switches this; the transactions list follows it
  const [month, setMonth] = useState(() => new Date())

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div>
        <h1 className='text-lg sm:text-xl md:text-2xl font-bold'>
          {t('home.dashboard.title')}
        </h1>
        <p className='text-sm text-muted-foreground capitalize'>
          {formatMonth(currentMonth(), i18n.language)}
        </p>
      </div>

      <HomeCards />

      <section className='space-y-3'>
        <h2 className='text-sm font-medium text-muted-foreground'>
          {t('home.dashboard.spendingTitle')}
        </h2>
        <DailySpendCard />
        <div className='grid gap-3 lg:grid-cols-2 items-start'>
          <div className='space-y-2'>
            <ExpensePieChart
              onCategorySelect={setCategory}
              selectedCategory={category}
              month={month}
              onMonthChange={setMonth}
            />
            <p className='text-xs text-muted-foreground px-1'>
              {t('home.dashboard.walletNote')}
            </p>
          </div>
          <RecentTransactions
            selectedCategory={category}
            onResetCategory={() => setCategory(undefined)}
            selectedWalletId={selectedWallet?.id}
            month={month}
          />
        </div>
      </section>
    </div>
  )
}

function DailySpendCard () {
  const { t } = useTranslation('common')
  const { planned, currency, spent, isLoading } = useMonthSpending()
  const today = new Date()

  return (
    <Card className='h-full'>
      <CardContent className='pt-5 space-y-3'>
        <div>
          <h3 className='font-medium'>{t('home.dashboard.dailyTitle')}</h3>
          <p className='text-xs text-muted-foreground'>
            {planned !== null
              ? t('home.dashboard.dailyHint')
              : t('home.dashboard.dailyNoPlan')}
          </p>
        </div>
        {isLoading || !spent ? (
          <div className='h-64 bg-muted animate-pulse rounded' />
        ) : spent.total === 0 && planned === null ? (
          <p className='h-64 flex items-center justify-center text-sm text-muted-foreground'>
            {t('home.dashboard.empty')}
          </p>
        ) : (
          <DailySpendChart
            rows={dailyCumulative(spent.byDay, planned, today)}
            currency={currency}
            today={today.getDate()}
          />
        )}
        {spent && spent.missing.length > 0 && (
          <p className='text-xs text-muted-foreground'>
            {t('home.spent.missing', { currencies: spent.missing.join(', ') })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
