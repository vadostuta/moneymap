'use client'

import { Template } from '@/types/template'
import { getLayoutById } from '@/lib/layout-registry'
import { getComponentById } from '@/lib/template-registry'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@/contexts/wallet-context'

// Import your actual chart components
import { ExpensePieChart } from '@/components/ui/ExpensePieChart'
import { RecentTransactions } from '@/components/transaction/RecentTransactions'
import { MonthlyExpenseBarChart } from '@/app/analytics/components/MonthlyExpenseBarChart'

interface TemplateViewerProps {
  template: Template
  className?: string
}

// Component mapping - maps componentId to actual React components
const COMPONENT_MAP = {
  expensePieChart: ExpensePieChart,
  recentTransactionsList: RecentTransactions,
  monthlyExpenseBarChart: MonthlyExpenseBarChart
} as const

function renderComponent (block: Template['blocks'][0], selectedWallet: any) {
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
          onCategorySelect={() => {}} // No-op for template preview
          selectedCategory={undefined}
          showWalletName={true}
          wallet={selectedWallet}
        />
      )

    case 'recentTransactionsList':
      return (
        <RecentTransactions
          key={block.id}
          selectedCategory={undefined}
          onResetCategory={() => {}}
          selectedWalletId={selectedWallet?.id}
        />
      )

    case 'monthlyExpenseBarChart':
      return (
        <MonthlyExpenseBarChartWrapper
          key={block.id}
          selectedWallet={selectedWallet}
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
  selectedWallet
}: {
  selectedWallet: any
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()

  // Use real data like other components - fetch from transactionService
  const {
    data: realData = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['transactions-by-category', 'current-month', selectedWallet?.id],
    queryFn: async () => {
      // Import transactionService here to avoid circular dependencies
      const { transactionService } = await import('@/lib/services/transaction')
      return await transactionService.getCurrentMonthExpensesByCategory(
        selectedWallet?.id
      )
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
          <div className='text-sm'>Failed to load chart data</div>
        </div>
      </div>
    )
  }

  return (
    <MonthlyExpenseBarChart
      data={realData}
      currency={selectedWallet?.currency || 'UAH'}
      selectedCategory={selectedCategory}
      onCategorySelect={setSelectedCategory}
    />
  )
}

export function TemplateViewer ({
  template,
  className = ''
}: TemplateViewerProps) {
  const { selectedWallet } = useWallet()
  const layoutDef = getLayoutById(template.layout)

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
        <div>
          <h2 className='text-2xl font-bold'>{template.name}</h2>
          <p className='text-sm text-muted-foreground'>
            {layoutDef.name} Layout • {template.blocks.length} components
          </p>
        </div>
      </div>

      {/* Render layout structure */}
      {layoutDef.structure.map((blocksInRow, rowIndex) => (
        <div
          key={rowIndex}
          className={`grid gap-4 ${
            blocksInRow === 1
              ? 'grid-cols-1'
              : blocksInRow === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
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
                {renderComponent(block, selectedWallet)}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
