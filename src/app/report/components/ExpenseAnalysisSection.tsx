'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'
import { usePrivacy } from '@/contexts/privacy-context'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/lib/services/category'
import { Transaction } from '@/lib/types/transaction'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { getTranslatedCategoryName } from '@/lib/categories-translations-mapper'

interface ExpenseAnalysisSectionProps {
  transactions: Transaction[]
  selectedMonth: Date
  walletId: string
  currency: string
}

const COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#10B981', // Green
  '#F97316' // Orange
]

export function ExpenseAnalysisSection ({
  transactions,
  selectedMonth,
  currency
}: ExpenseAnalysisSectionProps) {
  const { t } = useTranslation('common')
  const { formatAmount } = usePrivacy()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAllCategories()
  })

  // Calculate expenses by category
  const expensesByCategory = useMemo(() => {
    const expenseTransactions = transactions.filter(
      t => t.type === 'expense' && t.category_id !== 'Transfers'
    )

    const categoryMap = new Map<string, number>()

    expenseTransactions.forEach(t => {
      const current = categoryMap.get(t.category_id) || 0
      categoryMap.set(t.category_id, current + t.amount)
    })

    return Array.from(categoryMap.entries())
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId)
        return {
          categoryId,
          name: category
            ? getTranslatedCategoryName(category.name, t)
            : categoryId,
          amount
        }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [transactions, categories, t])

  const totalExpenses = expensesByCategory.reduce(
    (sum, cat) => sum + cat.amount,
    0
  )

  // Calculate daily spending pattern
  const dailySpending = useMemo(() => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense')
    const dailyMap = new Map<number, number>()

    expenseTransactions.forEach(t => {
      const day = new Date(t.date).getDate()
      const current = dailyMap.get(day) || 0
      dailyMap.set(day, current + t.amount)
    })

    const daysInMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      0
    ).getDate()

    const result = []
    for (let day = 1; day <= daysInMonth; day++) {
      result.push({
        day,
        amount: dailyMap.get(day) || 0
      })
    }

    return result
  }, [transactions, selectedMonth])

  const averageDailySpending = totalExpenses / dailySpending.length

  // Calculate expense patterns
  const expensePatterns = useMemo(() => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense')

    const recurring = expenseTransactions.filter(
      t => t.label === 'Recurring'
    ).length
    const business = expenseTransactions.filter(
      t => t.label === 'Business'
    ).length
    const personal = expenseTransactions.filter(
      t => t.label === 'Personal'
    ).length

    return { recurring, business, personal }
  }, [transactions])

  return (
    <div className='space-y-6'>
      {/* Top Spending Categories */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('report.expenses.topCategories', 'Top Spending Categories')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expensesByCategory.length > 0 ? (
            <ResponsiveContainer width='100%' height={400}>
              <BarChart data={expensesByCategory.slice(0, 10)}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='name'
                  angle={-45}
                  textAnchor='end'
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatAmount(value, currency)}
                />
                <Bar dataKey='amount' radius={[8, 8, 0, 0]}>
                  {expensesByCategory.slice(0, 10).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className='text-center py-12 text-muted-foreground'>
              {t('report.expenses.noData', 'No expense data for this month')}
            </div>
          )}
        </CardContent>
      </Card>

      <div className='grid md:grid-cols-2 gap-6'>
        {/* Daily Spending Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('report.expenses.dailyPattern', 'Daily Spending Pattern')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='mb-4'>
              <div className='text-sm text-muted-foreground'>
                {t('report.expenses.averageDaily', 'Average Daily Spending')}
              </div>
              <div className='text-2xl font-bold'>
                {formatAmount(averageDailySpending, currency)}
              </div>
            </div>
            <ResponsiveContainer width='100%' height={200}>
              <BarChart data={dailySpending}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='day' fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip
                  formatter={(value: number) => formatAmount(value, currency)}
                />
                <Bar dataKey='amount' fill='#EF4444' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('report.expenses.breakdown', 'Expense Breakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {expensesByCategory.slice(0, 5).map((cat, index) => (
                <div key={cat.categoryId} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div
                        className='w-3 h-3 rounded-full'
                        style={{
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                      <span className='text-sm font-medium'>{cat.name}</span>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-semibold'>
                        {formatAmount(cat.amount, currency)}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {((cat.amount / totalExpenses) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className='w-full bg-muted rounded-full h-2'>
                    <div
                      className='h-2 rounded-full transition-all'
                      style={{
                        width: `${(cat.amount / totalExpenses) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense by Label */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('report.expenses.byLabel', 'Expenses by Label')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-3 gap-4'>
            <div className='p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg'>
              <div className='text-sm text-muted-foreground mb-1'>
                {t('labels.Personal', 'Personal')}
              </div>
              <div className='text-2xl font-bold'>
                {expensePatterns.personal}
              </div>
              <div className='text-xs text-muted-foreground'>
                {t('report.expenses.transactions', 'transactions')}
              </div>
            </div>
            <div className='p-4 bg-green-100 dark:bg-green-900/20 rounded-lg'>
              <div className='text-sm text-muted-foreground mb-1'>
                {t('labels.Business', 'Business')}
              </div>
              <div className='text-2xl font-bold'>
                {expensePatterns.business}
              </div>
              <div className='text-xs text-muted-foreground'>
                {t('report.expenses.transactions', 'transactions')}
              </div>
            </div>
            <div className='p-4 bg-purple-100 dark:bg-purple-900/20 rounded-lg'>
              <div className='text-sm text-muted-foreground mb-1'>
                {t('labels.Recurring', 'Recurring')}
              </div>
              <div className='text-2xl font-bold'>
                {expensePatterns.recurring}
              </div>
              <div className='text-xs text-muted-foreground'>
                {t('report.expenses.transactions', 'transactions')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
