'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { useWallet } from '@/contexts/wallet-context'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CategoryData {
  id: string
  name: string
  total: number
  color: string
}

interface CategoryBubbleChartProps {
  data: CategoryData[]
  selectedCategory: string | null
  onCategorySelect: (categoryId: string | null) => void
}

export function CategoryBubbleChart ({
  data,
  selectedCategory,
  onCategorySelect
}: CategoryBubbleChartProps) {
  const { t } = useTranslation('common')
  const { selectedWallet } = useWallet()

  if (!data || data.length === 0) {
    return (
      <div className='flex items-center justify-center h-32 text-muted-foreground'>
        {t('analytics.noDataForMonth')}
      </div>
    )
  }

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      onCategorySelect(null) // Deselect if clicking the same category
    } else {
      onCategorySelect(categoryId)
    }
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {data.map(category => (
        <button
          key={category.id}
          type='button'
          onClick={() => handleCategoryClick(category.id)}
          className={cn(
            'transition-all duration-200 ease-in-out',
            selectedCategory === category.id ? 'scale-105' : ''
          )}
        >
          <Badge
            variant={selectedCategory === category.id ? 'default' : 'secondary'}
            className={cn(
              'py-2 px-3 text-sm cursor-pointer hover:opacity-90 flex items-center justify-center gap-2',
              selectedCategory === category.id ? 'shadow-sm' : ''
            )}
          >
            <div
              className='w-3 h-3 rounded-full'
              style={{ backgroundColor: category.color }}
            />
            <span className='truncate'>{category.name}</span>
          </Badge>
        </button>
      ))}
    </div>
  )
}
