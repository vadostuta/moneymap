'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'
import { usePrivacy } from '@/contexts/privacy-context'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/lib/services/category'
import { Transaction } from '@/lib/types/transaction'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'
import { getTranslatedCategoryName } from '@/lib/categories-translations-mapper'

interface IncomeAnalysisSectionProps {
  transactions: Transaction[]
  selectedMonth: Date
  walletId: string
  currency: string
}

const COLORS = [
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#06B6D4' // Cyan
]

export function IncomeAnalysisSection ({
  transactions,
  selectedMonth,
  currency
}: IncomeAnalysisSectionProps) {
  const { t } = useTranslation('common')
  const { formatAmount } = usePrivacy()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAllCategories()
  })

  // Calculate income by category
  const incomeByCategory = useMemo(() => {
    const incomeTransactions = transactions.filter(t => t.type === 'income')

    const categoryMap = new Map<string, number>()

    incomeTransactions.forEach(t => {
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

  const totalIncome = incomeByCategory.reduce((sum, cat) => sum + cat.amount, 0)

  // Month-over-month comparison
  useMemo(() => {
    const prev = new Date(selectedMonth)
    prev.setMonth(prev.getMonth() - 1)
    return prev
  }, [selectedMonth])

  return (
    <div className='space-y-6'>
      {/* Income Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('report.income.distribution', 'Income Distribution by Category')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incomeByCategory.length > 0 ? (
            <div className='grid md:grid-cols-2 gap-6'>
              <ResponsiveContainer width='100%' height={300}>
                <PieChart>
                  <Pie
                    data={incomeByCategory}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={entry =>
                      `${entry.name} (${(
                        (entry.amount / totalIncome) *
                        100
                      ).toFixed(1)}%)`
                    }
                    outerRadius={80}
                    fill='#8884d8'
                    dataKey='amount'
                  >
                    {incomeByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatAmount(value, currency)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              {/* Category Breakdown Table */}
              <div className='space-y-2'>
                <h3 className='font-semibold mb-4'>
                  {t('report.income.breakdown', 'Income Breakdown')}
                </h3>
                {incomeByCategory.map((cat, index) => (
                  <div
                    key={cat.categoryId}
                    className='flex items-center justify-between p-3 rounded-lg bg-muted/50'
                  >
                    <div className='flex items-center gap-3'>
                      <div
                        className='w-4 h-4 rounded-full'
                        style={{
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                      <span className='font-medium'>{cat.name}</span>
                    </div>
                    <div className='text-right'>
                      <div className='font-semibold'>
                        {formatAmount(cat.amount, currency)}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {((cat.amount / totalIncome) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className='text-center py-12 text-muted-foreground'>
              {t('report.income.noData', 'No income data for this month')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Income Sources */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('report.income.topSources', 'Top Income Sources')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incomeByCategory.slice(0, 5).length > 0 ? (
            <div className='space-y-4'>
              {incomeByCategory.slice(0, 5).map((cat, index) => (
                <div key={cat.categoryId} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      {index + 1}. {cat.name}
                    </span>
                    <span className='text-sm font-semibold'>
                      {formatAmount(cat.amount, currency)}
                    </span>
                  </div>
                  <div className='w-full bg-muted rounded-full h-2'>
                    <div
                      className='bg-green-500 h-2 rounded-full transition-all'
                      style={{
                        width: `${(cat.amount / totalIncome) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-muted-foreground'>
              {t('report.income.noSources', 'No income sources for this month')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
