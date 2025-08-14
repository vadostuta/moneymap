'use client'

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MonthSelectorProps {
  selectedMonth: Date
  onMonthSelect: (month: Date) => void
  availableMonths: Date[]
}

export function MonthSelector ({
  selectedMonth,
  onMonthSelect,
  availableMonths
}: MonthSelectorProps) {
  const { t } = useTranslation('common')

  const formatMonth = (date: Date) => {
    return new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
  }

  const formatYear = (date: Date) => {
    return date.getFullYear().toString()
  }

  const isSelected = (month: Date) => {
    return (
      month.getMonth() === selectedMonth.getMonth() &&
      month.getFullYear() === selectedMonth.getFullYear()
    )
  }

  const isCurrentMonth = (month: Date) => {
    const now = new Date()
    return (
      month.getMonth() === now.getMonth() &&
      month.getFullYear() === now.getFullYear()
    )
  }

  if (availableMonths.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>
            {t('analytics.monthlyExpenses')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            {t('analytics.noExpenseData')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='flex flex-wrap gap-1.5 justify-center sm:justify-start'>
      {availableMonths.map((month, index) => (
        <button
          key={index}
          onClick={() => onMonthSelect(month)}
          className={cn(
            'flex flex-col items-center justify-center w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-105 cursor-pointer',
            isSelected(month)
              ? 'border-primary bg-primary text-primary-foreground shadow-md'
              : 'border-border hover:border-primary/50 hover:bg-accent/50',
            isCurrentMonth(month) && !isSelected(month)
              ? 'border-primary/30 bg-primary/10'
              : ''
          )}
        >
          <span
            className={cn(
              'text-xs font-medium leading-tight',
              isSelected(month) ? 'text-primary-foreground' : 'text-foreground'
            )}
          >
            {formatMonth(month)}
          </span>
          <span
            className={cn(
              'text-[9px] leading-tight',
              isSelected(month)
                ? 'text-primary-foreground/80'
                : 'text-muted-foreground'
            )}
          >
            {formatYear(month)}
          </span>
        </button>
      ))}
    </div>
  )
}
