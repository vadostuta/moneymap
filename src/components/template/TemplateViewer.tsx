'use client'

import { Template } from '@/types/template'
import { getLayoutById } from '@/lib/layout-registry'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@/contexts/wallet-context'
import { Wallet } from '@/lib/types/wallet'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/auth-context'
import { transactionService } from '@/lib/services/transaction'

// Import your actual chart components
import { ExpensePieChart } from '@/components/ui/ExpensePieChart'
import { RecentTransactions } from '@/components/transaction/RecentTransactions'
import { MonthlyExpenseBarChart } from '@/app/analytics/components/MonthlyExpenseBarChart'
import { MonthSelector } from './MonthSelector'

interface TemplateViewerProps {
  template: Template
  className?: string
  backButton?: React.ReactNode
}

// Component mapping - maps componentId to actual React components
const COMPONENT_MAP = {
  expensePieChart: ExpensePieChart,
  recentTransactionsList: RecentTransactions,
  monthlyExpenseBarChart: MonthlyExpenseBarChart
} as const

function renderComponent (
  block: Template['blocks'][0],
  selectedWallet: Wallet | null,
  selectedCategory?: string,
  selectedMonth?: Date,
  onCategorySelect?: (category: string | undefined) => void,
  onResetCategory?: () => void
) {
  const Component = COMPONENT_MAP[block.componentId]

  if (!Component) {
    return (
      <div className='border border-dashed border-muted-foreground/25 rounded-lg p-4 h-32 flex items-center justify-center text-muted-foreground'>
        <div className='text-center'>
          <div className='text-2xl mb-1'>❌</div>
          <div className='text-xs'>
            Component not found: {block.componentId}
          </div>
        </div>
      </div>
    )
  }

  // Render components with appropriate props based on componentId
  switch (block.componentId) {
    case 'expensePieChart':
      return (
        <ExpensePieChart
          key={block.id}
          onCategorySelect={onCategorySelect || (() => {})}
          selectedCategory={selectedCategory}
          showWalletName={true}
          wallet={selectedWallet || undefined}
          month={selectedMonth}
        />
      )

    case 'recentTransactionsList':
      return (
        <RecentTransactions
          key={block.id}
          selectedCategory={selectedCategory}
          onResetCategory={onResetCategory || (() => {})}
          selectedWalletId={selectedWallet?.id}
          month={selectedMonth}
        />
      )

    case 'monthlyExpenseBarChart':
      return (
        <MonthlyExpenseBarChartWrapper
          key={block.id}
          selectedWallet={selectedWallet}
          selectedCategory={selectedCategory}
          onCategorySelect={onCategorySelect}
          month={selectedMonth}
        />
      )

    default:
      return (
        <div className='border border-dashed border-muted-foreground/25 rounded-lg p-4 h-32 flex items-center justify-center text-muted-foreground'>
          <div className='text-center'>
            <div className='text-2xl mb-1'>❌</div>
            <div className='text-xs'>
              Unknown component: {block.componentId}
            </div>
          </div>
        </div>
      )
  }
}

// Wrapper component for MonthlyExpenseBarChart that provides real data
function MonthlyExpenseBarChartWrapper ({
  selectedWallet,
  selectedCategory,
  onCategorySelect,
  month
}: {
  selectedWallet: Wallet | null
  selectedCategory?: string
  onCategorySelect?: (category: string | undefined) => void
  month?: Date
}) {
  const { t } = useTranslation('common')
  // Use real data like other components - fetch from transactionService
  const {
    data: realData = [],
    isLoading,
    error
  } = useQuery({
    queryKey: [
      'transactions-by-category',
      month ? 'specific-month' : 'current-month',
      selectedWallet?.id,
      month?.getFullYear(),
      month?.getMonth()
    ],
    queryFn: async () => {
      // Import transactionService here to avoid circular dependencies
      const { transactionService } = await import('@/lib/services/transaction')
      if (month) {
        return await transactionService.getMonthlyExpensesByCategory(
          selectedWallet?.id || '',
          month.getFullYear(),
          month.getMonth()
        )
      } else {
        return await transactionService.getCurrentMonthExpensesByCategory(
          selectedWallet?.id
        )
      }
    }
  })

  if (isLoading) {
    return (
      <div className='border rounded-lg p-4 h-32 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2'></div>
          <div className='text-sm text-muted-foreground'>
            Loading chart data...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='border border-destructive rounded-lg p-4 h-32 flex items-center justify-center'>
        <div className='text-center text-destructive'>
          <div className='text-2xl mb-1'>⚠️</div>
          <div className='text-sm'>{t('ui.failedToLoad')}</div>
        </div>
      </div>
    )
  }

  return (
    <MonthlyExpenseBarChart
      data={realData}
      currency={selectedWallet?.currency || 'UAH'}
      selectedCategory={selectedCategory}
      onCategorySelect={onCategorySelect || (() => {})}
    />
  )
}

export function TemplateViewer ({
  template,
  className = '',
  backButton
}: TemplateViewerProps) {
  const { selectedWallet } = useWallet()
  const { user } = useAuth()
  const layoutDef = getLayoutById(template.layout)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())

  // Fetch available months efficiently (only fetches date field, not full transactions)
  const { data: availableMonths = [] } = useQuery({
    queryKey: ['available-months', selectedWallet?.id],
    queryFn: async () => {
      if (!selectedWallet?.id) return []
      return await transactionService.getAvailableMonthsForWallet(
        selectedWallet.id,
        2 // Look back 2 years
      )
    },
    enabled: !!selectedWallet?.id && !!user,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  })

  // Auto-sync selected month when available months change
  useEffect(() => {
    if (
      availableMonths.length > 0 &&
      !availableMonths.some(
        month =>
          month.getMonth() === selectedMonth.getMonth() &&
          month.getFullYear() === selectedMonth.getFullYear()
      )
    ) {
      setSelectedMonth(availableMonths[0])
    }
  }, [availableMonths, selectedMonth])

  const handleCategorySelect = (category: string | undefined) => {
    setSelectedCategory(category)
  }

  const handleResetCategory = () => {
    setSelectedCategory(undefined)
  }

  const handleMonthSelect = (month: Date) => {
    setSelectedMonth(month)
  }

  if (!layoutDef) {
    return (
      <div className='border border-destructive rounded-lg p-4 text-destructive'>
        Unknown layout: {template.layout}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Template Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          {backButton}
          <h2 className='text-xl sm:text-2xl font-bold truncate'>
            {template.name}
          </h2>
        </div>
      </div>

      {/* Month Selector - permanent control */}
      {selectedWallet && availableMonths.length > 0 && (
        <div className='w-full'>
          <MonthSelector
            selectedMonth={selectedMonth}
            onMonthSelect={handleMonthSelect}
            availableMonths={availableMonths.slice(0, 12)}
          />
        </div>
      )}

      {/* Render layout structure */}
      {template.layout === '2-1-side' ? (
        // Special handling for side-by-side layout
        <div className='grid grid-cols-1 min-[821px]:grid-cols-2 gap-4'>
          {/* Left side - 2 stacked blocks */}
          <div className='space-y-8 min-[821px]:pr-3'>
            {template.blocks.slice(0, 2).map(block => (
              <div key={block.id}>
                {renderComponent(
                  block,
                  selectedWallet,
                  selectedCategory,
                  selectedMonth,
                  handleCategorySelect,
                  handleResetCategory
                )}
              </div>
            ))}
          </div>
          {/* Right side - 1 full height block */}
          <div>
            {template.blocks[2] && (
              <div key={template.blocks[2].id}>
                {renderComponent(
                  template.blocks[2],
                  selectedWallet,
                  selectedCategory,
                  selectedMonth,
                  handleCategorySelect,
                  handleResetCategory
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Standard row-based layout
        layoutDef.structure.map((blocksInRow, rowIndex) => (
          <div
            key={rowIndex}
            className={`grid gap-4 ${
              blocksInRow === 1
                ? 'grid-cols-1'
                : blocksInRow === 2
                ? 'grid-cols-1 min-[821px]:grid-cols-2'
                : 'grid-cols-1 min-[821px]:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {Array.from({ length: blocksInRow }).map((_, blockIndex) => {
              // Calculate which block from the template.blocks array this position corresponds to
              const componentIndex =
                layoutDef.structure
                  .slice(0, rowIndex)
                  .reduce((acc, r) => acc + r, 0) + blockIndex

              const block = template.blocks[componentIndex]

              // Only render if block exists, otherwise skip (no empty slot display)
              if (!block) {
                return null
              }

              return (
                <div key={block.id} className='w-full'>
                  {renderComponent(
                    block,
                    selectedWallet,
                    selectedCategory,
                    selectedMonth,
                    handleCategorySelect,
                    handleResetCategory
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
