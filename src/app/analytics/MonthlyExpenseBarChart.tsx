'use client'

import React from 'react'
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'
import { categoryService } from '@/lib/services/category'
import { useQuery } from '@tanstack/react-query'
import { getTranslatedCategoryName } from '@/lib/categories-translations-mapper'
import { usePrivacy } from '@/contexts/privacy-context'

interface MonthlyExpenseBarChartProps {
  data: { category_id: string; amount: number }[]
  currency: string
  selectedCategory?: string
  onCategorySelect: (categoryId: string | undefined) => void
}

// Use the same colors as ExpensePieChart for consistency
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

export function MonthlyExpenseBarChart ({
  data,
  currency,
  selectedCategory,
  onCategorySelect
}: MonthlyExpenseBarChartProps) {
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

  // Create a consistent color mapping for categories
  const categoryColorMap = new Map<string, string>()

  const chartData = data
    .filter(item => {
      // Filter out transfers category
      const category = categories.find(cat => cat.id === item.category_id)
      return category?.name !== 'Transfers'
    })
    .map((item, index) => {
      const category = categories.find(cat => cat.id === item.category_id)

      // Assign consistent color based on category ID or index
      let color: string
      if (categoryColorMap.has(item.category_id)) {
        color = categoryColorMap.get(item.category_id)!
      } else {
        color = COLORS[index % COLORS.length]
        categoryColorMap.set(item.category_id, color)
      }

      return {
        ...item,
        categoryName: category
          ? getTranslatedCategoryName(category.name, t)
          : 'Unknown',
        color: color
      }
    })
    .sort((a, b) => b.amount - a.amount)

  const CustomTooltip = ({
    active,
    payload,
    label
  }: {
    active: boolean
    payload: { value: number }[]
    label: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-background border rounded-lg p-2 shadow-lg'>
          <p className='font-medium'>{label}</p>
          <p className='text-sm text-muted-foreground'>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  const handleBarClick = (data: { category_id: string }) => {
    const newCategoryId =
      selectedCategory === data.category_id ? undefined : data.category_id
    onCategorySelect(newCategoryId)
  }

  return (
    <Card>
      <CardContent>
        <div className='h-[400px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis
                dataKey='categoryName'
                angle={-45}
                textAnchor='end'
                height={80}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={value => formatCurrency(value)}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={<CustomTooltip active={false} payload={[]} label='' />}
              />
              <Bar dataKey='amount' onClick={handleBarClick} cursor='pointer'>
                {chartData.map(entry => (
                  <Cell
                    key={`cell-${entry.category_id}`}
                    fill={entry.color}
                    opacity={
                      !selectedCategory ||
                      selectedCategory === entry.category_id
                        ? 1
                        : 0.5
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Legend */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4'>
          {chartData.map(entry => (
            <div
              key={entry.category_id}
              className='flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity p-2 rounded-lg hover:bg-accent/50'
              onClick={() => handleBarClick(entry)}
            >
              <div
                className='w-4 h-4 rounded-full flex-shrink-0'
                style={{
                  backgroundColor: entry.color,
                  opacity:
                    !selectedCategory || selectedCategory === entry.category_id
                      ? 1
                      : 0.5
                }}
              />
              <span className='text-sm text-muted-foreground truncate'>
                {entry.categoryName}
              </span>
              <span className='text-sm font-semibold ml-auto text-foreground'>
                {formatCurrency(entry.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
