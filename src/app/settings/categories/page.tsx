'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryService } from '@/lib/services/category'
import { Switch } from '@/components/ui/switch'
import { toastService } from '@/lib/services/toast'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export default function CategoriesPage () {
  const { t } = useTranslation('common')
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      categoryService.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toastService.success(t('settings.categories.updateSuccess'))
    },
    onError: () => {
      toastService.error(t('settings.categories.updateError'))
    }
  })

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[...Array(5)].map((_, i) => (
          <div key={i} className='h-12 bg-muted animate-pulse rounded-lg' />
        ))}
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>
          {t('settings.categories.title')}
        </h2>
      </div>

      <div className='grid gap-4'>
        {categories.map(category => (
          <div
            key={category.id}
            className={cn(
              'flex items-center justify-between p-4 rounded-lg border',
              category.is_active ? 'bg-card' : 'bg-muted/50'
            )}
          >
            <div className='flex items-center gap-3'>
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  category.color_bg
                )}
              >
                <span className={category.color_text}>{category.icon}</span>
              </div>
              <span className='font-medium'>{category.name}</span>
            </div>
            <Switch
              checked={category.is_active}
              onCheckedChange={checked =>
                updateMutation.mutate({ id: category.id, is_active: checked })
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}
