'use client'

import * as React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  TooltipProps,
  Tooltip as RechartsTooltip
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { transactionService } from '@/lib/services/transaction'
import { useQuery } from '@tanstack/react-query'
import { ResponsiveContainer } from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { walletService } from '@/lib/services/wallet'
import { useTranslation } from 'react-i18next'
import { categoryService } from '@/lib/services/category'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { getTranslatedCategoryName } from '@/lib/categories-translations-mapper'

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
  setSelectedWalletId: (walletId: string) => void
}

export function ExpensePieChart ({
  onCategorySelect,
  selectedCategory,
  setSelectedWalletId: setSelectedWalletIdInput
}: ExpensePieChartProps) {
  const { t } = useTranslation('common')

  // Fetch available wallets with currency information
  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletService.getAllActive()
  })

  // Set default wallet ID when wallets are loaded
  const [selectedWalletId, setSelectedWalletId] = React.useState<string>('')

  // Update selectedWalletId when wallets are loaded
  React.useEffect(() => {
    if (wallets && wallets.length > 0) {
      // First try to find a primary wallet
      const primaryWallet = wallets.find(wallet => wallet.is_primary)

      if (primaryWallet) {
        setSelectedWalletId(primaryWallet.id)
        setSelectedWalletIdInput(primaryWallet.id)
      } else {
        // Only if no primary wallet, fall back to the first wallet (but do NOT set it as primary)
        const firstWallet = wallets[0]
        if (firstWallet) {
          setSelectedWalletId(firstWallet.id)
          setSelectedWalletIdInput(firstWallet.id)
        }
      }
    }
  }, [wallets, setSelectedWalletIdInput])

  // Get the selected wallet's currency
  const selectedWallet = wallets?.find(wallet => wallet.id === selectedWalletId)
  const currency = selectedWallet?.currency || 'UAH' // Fallback to UAH if no wallet selected

  // Fetch expenses by category with wallet filter
  const { data, isLoading, error } = useQuery({
    queryKey: ['expenses-by-category', selectedWalletId],
    queryFn: () =>
      transactionService.getCurrentMonthExpensesByCategory(selectedWalletId)
  })

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

  const handlePieClick = (entry: { category_id: string }) => {
    if (entry && entry.category_id) {
      const newCategoryId =
        selectedCategory === entry.category_id ? undefined : entry.category_id
      onCategorySelect(newCategoryId)
    }
  }

  const handleWalletChange = (value: string) => {
    setSelectedWalletId(value)
    setSelectedWalletIdInput(value)
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

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg text-muted-foreground font-medium flex flex-col items-center gap-2'>
            <div>
              <div>{t('overview.currentMonthExpenses')}</div>
            </div>
            <Select value={selectedWalletId} onValueChange={handleWalletChange}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder={t('wallets.selectWallet')} />
              </SelectTrigger>
              <SelectContent>
                {wallets?.map(wallet => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center h-[180px]'>
          <p>{t('common.loading')}</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg text-muted-foreground font-medium flex flex-col items-center gap-2'>
            <div>
              <div>{t('overview.currentMonthExpenses')}</div>
            </div>
            <Select value={selectedWalletId} onValueChange={handleWalletChange}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder={t('wallets.selectWallet')} />
              </SelectTrigger>
              <SelectContent>
                {wallets?.map(wallet => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center h-[180px]'>
          <p>{t('common.error')}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg text-muted-foreground font-medium flex flex-col items-center gap-2'>
            <div>
              <div>{t('overview.currentMonthExpenses')}</div>
            </div>
            <Select value={selectedWalletId} onValueChange={handleWalletChange}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder={t('wallets.selectWallet')} />
              </SelectTrigger>
              <SelectContent>
                {wallets?.map(wallet => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center h-[180px]'>
          <p>{t('overview.noExpenseData')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className='flex flex-col md:flex-row items-center gap-2  flex-wrap'>
        <div className='flex justify-between items-center'>
          <CardTitle className='text-lg text-muted-foreground font-medium flex flex-col items-center gap-2'>
            <div>
              <div>{t('overview.currentMonthExpenses')}</div>
            </div>
            <Select value={selectedWalletId} onValueChange={handleWalletChange}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder={t('wallets.selectWallet')} />
              </SelectTrigger>
              <SelectContent>
                {wallets?.map(wallet => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
        </div>
        <div className='text-2xl font-bold mt-2 text-foreground tracking-tight'>
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
                          className='w-3 h-3 rounded-full border border-white/30 flex-shrink-0'
                          style={{
                            backgroundColor: COLORS[colorIdx % COLORS.length],
                            opacity:
                              !selectedCategory ||
                              selectedCategory === entry.category_id
                                ? 1
                                : 0.5
                          }}
                        />
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
      </CardContent>
    </Card>
  )
}
