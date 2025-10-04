'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'
import { usePrivacy } from '@/contexts/privacy-context'
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface MonthlySummaryCardsProps {
  metrics: {
    income: number
    expenses: number
    net: number
    savingsRate: number
  }
  currency: string
  isLoading: boolean
}

export function MonthlySummaryCards ({
  metrics,
  currency,
  isLoading
}: MonthlySummaryCardsProps) {
  const { t } = useTranslation('common')
  const { formatAmount } = usePrivacy()

  if (isLoading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-4 rounded-full' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-32 mb-2' />
              <Skeleton className='h-3 w-24' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: t('report.cards.income'),
      value: formatAmount(metrics.income, currency),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: t('report.cards.expenses'),
      value: formatAmount(metrics.expenses, currency),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    },
    {
      title: t('report.cards.net'),
      value: formatAmount(metrics.net, currency),
      icon: DollarSign,
      color: metrics.net >= 0 ? 'text-blue-600' : 'text-orange-600',
      bgColor:
        metrics.net >= 0
          ? 'bg-blue-100 dark:bg-blue-900/20'
          : 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      title: t('report.cards.savingsRate'),
      value: `${metrics.savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      color: metrics.savingsRate >= 20 ? 'text-green-600' : 'text-yellow-600',
      bgColor:
        metrics.savingsRate >= 20
          ? 'bg-green-100 dark:bg-green-900/20'
          : 'bg-yellow-100 dark:bg-yellow-900/20'
    }
  ]

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{card.value}</div>
              {index === 3 && (
                <p className='text-xs text-muted-foreground mt-1'>
                  {metrics.savingsRate >= 20
                    ? t('report.cards.savingsGood', 'Great savings!')
                    : metrics.savingsRate >= 10
                    ? t('report.cards.savingsOk', 'Keep it up')
                    : t('report.cards.savingsPoor', 'Consider saving more')}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
