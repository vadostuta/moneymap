'use client'

import * as React from 'react'
import { PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { transactionService } from '@/lib/services/transaction'
import { useQuery } from '@tanstack/react-query'
import { ResponsiveContainer } from 'recharts'
import { Tooltip } from 'recharts'
import { TransactionCategory } from '@/lib/types/transaction'

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

interface ExpensePieChartProps {
  onCategorySelect: (category: TransactionCategory | undefined) => void
  selectedCategory?: TransactionCategory
}

export function ExpensePieChart ({
  onCategorySelect,
  selectedCategory
}: ExpensePieChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['expenses-by-category'],
    queryFn: () => transactionService.getCurrentMonthExpensesByCategory()
  })

  const currency = 'UAH'
  const totalExpense = data?.reduce((sum, item) => sum + item.amount, 0) || 0

  // Format currency consistently
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const handlePieClick = (entry: { category: TransactionCategory }) => {
    if (entry && entry.category) {
      const newCategory =
        selectedCategory === entry.category ? undefined : entry.category
      onCategorySelect(newCategory)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Month Expenses</CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center h-[180px]'>
          <p>Loading expense data...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Month Expenses</CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center h-[180px]'>
          <p>Error loading expense data</p>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Month Expenses</CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center h-[180px]'>
          <p>No expense data available for last month.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg text-muted-foreground font-medium'>
          Current Month Expenses
        </CardTitle>
        <div className='text-4xl font-extrabold mt-2 text-white tracking-tight'>
          {formatCurrency(totalExpense)}
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-[230px]'>
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
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    style={{
                      opacity:
                        !selectedCategory || selectedCategory === entry.category
                          ? 1
                          : 0.5
                    }}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4'>
          {data.map((entry, index) => (
            <div
              key={entry.category}
              className='flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity p-2 rounded-lg hover:bg-white/5'
              onClick={() =>
                handlePieClick({
                  category: entry.category as TransactionCategory
                })
              }
            >
              <div
                className='w-3 h-3 rounded-full border border-white/30 flex-shrink-0'
                style={{
                  backgroundColor: COLORS[index % COLORS.length],
                  opacity:
                    !selectedCategory || selectedCategory === entry.category
                      ? 1
                      : 0.5
                }}
              />
              <span className='text-sm sm:text-base text-muted-foreground truncate'>
                {entry.category}
              </span>
              <span className='text-sm font-semibold ml-auto text-white whitespace-nowrap'>
                {formatCurrency(entry.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
