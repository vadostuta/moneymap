'use client'

import * as React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  TooltipProps,
  Tooltip as RechartsTooltip
} from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { transactionService } from '@/lib/services/transaction'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import { categoryService } from '@/lib/services/category'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { getTranslatedCategoryName } from '@/lib/categories-translations-mapper'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWallet } from '@/contexts/wallet-context'
import { usePrivacy } from '@/contexts/privacy-context'
import { Wallet } from '@/lib/types/wallet'

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
  onCategorySelect: (categoryId: string | undefined) => void
  selectedCategory?: string
  wallet?: Wallet // Optional wallet prop to override context wallet
  showWalletName?: boolean // Whether to show wallet name in the header
  month?: Date // Optional month prop for filtering data
  onMonthChange?: (month: Date) => void // Shows prev/next month controls when set
}

export function ExpensePieChart ({
  onCategorySelect,
  selectedCategory,
  wallet,
  showWalletName = false,
  month,
  onMonthChange
}: ExpensePieChartProps) {
  const { t, i18n } = useTranslation('common')
  const { selectedWallet } = useWallet()
  const { formatAmount } = usePrivacy()
  const [type, setType] = React.useState<'net' | 'expense' | 'income'>('net') // Default to 'net'

  // Use the provided wallet or fall back to context wallet
  const currentWallet = wallet || selectedWallet
  const selectedWalletId = currentWallet?.id || ''

  // Get the current wallet's currency
  const currency = currentWallet?.currency || 'UAH' // Fallback to UAH if no wallet selected

  // Determine which month to use
  const targetMonth = month || new Date()
  const year = targetMonth.getFullYear()
  const monthIndex = targetMonth.getMonth()
  const now = new Date()
  const isCurrentOrFuture =
    year > now.getFullYear() ||
    (year === now.getFullYear() && monthIndex >= now.getMonth())

  const shiftMonth = (count: number) => {
    onMonthChange?.(new Date(year, monthIndex + count, 1))
    if (selectedCategory) onCategorySelect(undefined)
  }

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories
  })

  // Fetch data by category with wallet filter
  const {
    data = [],
    isLoading,
    error
  } = useQuery({
    queryKey: [
      'transactions-by-category',
      selectedWalletId,
      type,
      year,
      monthIndex
    ],
    queryFn: async () => {
      if (type === 'net') {
        return month
          ? transactionService.getMonthlyNetByCategory(
              selectedWalletId,
              year,
              monthIndex
            )
          : transactionService.getCurrentMonthNetByCategory(selectedWalletId)
      } else if (type === 'expense') {
        return month
          ? transactionService.getMonthlyExpensesByCategory(
              selectedWalletId,
              year,
              monthIndex
            )
          : transactionService.getCurrentMonthExpensesByCategory(
              selectedWalletId
            )
      } else {
        return month
          ? transactionService.getMonthlyIncomeByCategory(
              selectedWalletId,
              year,
              monthIndex
            )
          : transactionService.getCurrentMonthIncomeByCategory(selectedWalletId)
      }
    },
    // Keep showing the previous tab's chart while the new one loads
    placeholderData: keepPreviousData
  })

  const handleTypeChange = (value: string) => {
    setType(value as 'net' | 'expense' | 'income')
    // A category picked on one tab usually doesn't exist on another
    if (selectedCategory) onCategorySelect(undefined)
  }

  const totalExpense = data.reduce((sum, item) => sum + item.amount, 0)

  // Remove the old formatCurrency function and use formatAmount from privacy context
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
  data.forEach((entry, idx) => {
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

  return (
    <Card>
      <CardHeader className='flex flex-col md:flex-row items-start justify-between gap-4 flex-wrap'>
        {/* Left side: Total */}
        <div className='flex flex-col gap-4'>
          {showWalletName && currentWallet && (
            <div className='text-lg font-semibold text-foreground'>
              {currentWallet.name}
            </div>
          )}
          <div className='text-2xl font-bold text-foreground tracking-tight'>
            {isLoading || error ? '—' : formatCurrency(totalExpense)}
          </div>
        </div>

        {/* Right side: Month switcher + tabs */}
        <div className='flex flex-col items-end gap-2'>
          {onMonthChange && (
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8'
                onClick={() => shiftMonth(-1)}
                aria-label={t('common.back')}
              >
                <ChevronLeftIcon className='h-4 w-4' />
              </Button>
              <span className='min-w-[9rem] text-center text-sm font-medium capitalize'>
                {targetMonth.toLocaleDateString(
                  i18n.language === 'ua' ? 'uk-UA' : 'en-US',
                  { month: 'long', year: 'numeric' }
                )}
              </span>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8'
                onClick={() => shiftMonth(1)}
                disabled={isCurrentOrFuture}
                aria-label={t('common.next')}
              >
                <ChevronRightIcon className='h-4 w-4' />
              </Button>
            </div>
          )}
          <Tabs
            value={type}
            onValueChange={handleTypeChange}
            className='w-full md:w-auto'
          >
            <TabsList>
              <TabsTrigger value='net'>{t('overview.net')}</TabsTrigger>
              <TabsTrigger value='expense'>
                {t('overview.expenses')}
              </TabsTrigger>
              <TabsTrigger value='income'>{t('overview.income')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || error || data.length === 0 ? (
          <div className='flex items-center justify-center h-[180px] text-muted-foreground'>
            <p>
              {isLoading
                ? t('common.loading')
                : error
                  ? t('common.error')
                  : t('overview.noData')}
            </p>
          </div>
        ) : (
          <>
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
            </div>
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
                                backgroundColor:
                                  COLORS[colorIdx % COLORS.length],
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
