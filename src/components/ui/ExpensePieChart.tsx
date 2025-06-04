'use client'

import * as React from 'react'
import { PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { transactionService } from '@/lib/services/transaction'
import { useQuery } from '@tanstack/react-query'

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

const chartConfig = {
  expenses: {
    label: 'Expenses by Category',
    color: 'hsl(341 90% 62%)'
  }
}

export function ExpensePieChart () {
  const { data, isLoading, error } = useQuery({
    queryKey: ['expenses-by-category'],
    queryFn: () => transactionService.getCurrentMonthExpensesByCategory()
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center h-[300px]'>
          <p>Loading expense data...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center h-[300px]'>
          <p>Error loading expense data</p>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center h-[300px]'>
          <p>No expense data available for last month.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className='aspect-square h-[300px] w-full'
        >
          <PieChart>
            <Pie
              data={data}
              dataKey='amount'
              nameKey='category'
              cx='50%'
              cy='50%'
              outerRadius={100}
              fill='#8884d8'
              label={({ category, percent }) =>
                `${category} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <ChartTooltip
              formatter={(value: number) =>
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(value)
              }
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
