'use client'

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  TooltipProps,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'
import { categoryService } from '@/lib/services/category'
import { useQuery } from '@tanstack/react-query'
import { getTranslatedCategoryName } from '@/lib/categories-translations-mapper'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { usePrivacy } from '@/contexts/privacy-context'

// Define colors for different categories
const COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEEAD', // Yellow
  '#D4A5A5', // Pink
  '#9B59B6', // Purple
  '#3498DB', // Light Blue
  '#E67E22', // Orange
  '#2ECC71', // Emerald
  '#1ABC9C', // Turquoise
  '#F1C40F' // Gold
]

interface MonthlyExpensePieChartProps {
  data: { category_id: string; amount: number }[]
  currency: string
  selectedCategory?: string
  onCategorySelect: (categoryId: string | undefined) => void
}

export function MonthlyExpensePieChart ({
  data,
  currency,
  selectedCategory,
  onCategorySelect
}: MonthlyExpensePieChartProps) {
  const { t } = useTranslation('common')
  const { formatAmount } = usePrivacy()

  // Fetch categories for names
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories
  })

  const formatCurrency = (amount: number) => {
    return formatAmount(amount, currency)
  }

  const handlePieClick = (entry: { category_id: string }) => {
    if (entry && entry.category_id) {
      const newCategoryId =
        selectedCategory === entry.category_id ? undefined : entry.category_id
      onCategorySelect(newCategoryId)
    }
  }

  const categoryColorIndex: Record<string, number> = {}
  data?.forEach((entry, idx) => {
    categoryColorIndex[entry.category_id] = idx
  })

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: TooltipProps<string, number>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const category = categories.find(cat => cat.id === data.category_id)
      const categoryName = category?.name ?? ''

      return (
        <div className='bg-background border rounded-lg p-2 shadow-lg'>
          <p className='font-medium'>
            {getTranslatedCategoryName(categoryName, t)}
          </p>
          <p className='text-sm text-muted-foreground'>
            {formatCurrency(data.amount)}
          </p>
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center h-[180px]'>
          <p className='text-muted-foreground'>
            {t('analytics.noDataForMonth')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='h-[200px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <Pie
            data={data}
            cx='50%'
            cy='50%'
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey='amount'
            nameKey='category'
            onClick={handlePieClick}
            cursor='pointer'
          >
            {data.map((entry, index) => {
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  style={{
                    opacity:
                      !selectedCategory ||
                      selectedCategory === entry.category_id
                        ? 1
                        : 0.5
                  }}
                />
              )
            })}
          </Pie>
          <RechartsTooltip content={CustomTooltip} />
        </PieChart>
      </ResponsiveContainer>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-1 mt-4'>
        {[...data]
          .sort((a, b) => b.amount - a.amount)
          .map(entry => {
            const category = categories.find(
              cat => cat.id === entry.category_id
            )
            const categoryName = category?.name ?? ''
            const colorIdx = categoryColorIndex[entry.category_id]
            return (
              <TooltipProvider key={entry.category_id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className='flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity p-2 rounded-lg hover:bg-white/5'
                      onClick={() =>
                        handlePieClick({
                          category_id: entry.category_id
                        })
                      }
                    >
                      <div
                        className='flex items-center justify-center w-6 h-6 rounded-full border border-white/30 flex-shrink-0'
                        style={{
                          backgroundColor: COLORS[colorIdx % COLORS.length],
                          opacity:
                            !selectedCategory ||
                            selectedCategory === entry.category_id
                              ? 1
                              : 0.5
                        }}
                      >
                        <span className='text-sm'>
                          {category?.icon || '📌'}
                        </span>
                      </div>
                      <span className='text-sm sm:text-base text-muted-foreground truncate'>
                        {getTranslatedCategoryName(categoryName, t)}
                      </span>
                      <span className='text-sm font-semibold ml-auto text-foreground whitespace-nowrap'>
                        {formatCurrency(entry.amount)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getTranslatedCategoryName(categoryName, t)}</p>
                    <p className='text-sm text-muted-foreground'>
                      {formatCurrency(entry.amount)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
      </div>
    </div>
  )
}
