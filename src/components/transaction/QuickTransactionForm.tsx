'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TransactionCategory,
  TransactionType,
  CreateTransactionDTO,
  Transaction
} from '@/lib/types/transaction'
import { transactionService } from '@/lib/services/transaction'
import { walletService } from '@/lib/services/wallet'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toastService } from '@/lib/services/toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryService } from '@/lib/services/category'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

interface QuickTransactionFormProps {
  variant?: 'default' | 'wide'
  initialData?: Transaction
  onSuccess?: () => void
  onCancel?: () => void
}

export function QuickTransactionForm ({
  variant = 'default',
  initialData,
  onSuccess,
  onCancel
}: QuickTransactionFormProps) {
  const { t } = useTranslation('common')
  const queryClient = useQueryClient()

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: walletService.getAll
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories
  })

  const transactionMutation = useMutation({
    mutationFn: async (transaction: CreateTransactionDTO) => {
      if (initialData) {
        await transactionService.update(initialData.id, transaction)
      } else {
        await transactionService.create(transaction)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] })
      queryClient.invalidateQueries({ queryKey: ['list-transactions'] })

      toastService.success(
        initialData
          ? t('transactions.updateSuccess')
          : t('transactions.addSuccess')
      )
      setFormData({
        type: 'expense',
        amount: '',
        wallet_id: formData.wallet_id,
        category: '' as TransactionCategory,
        date: new Date().toISOString().split('T')[0],
        description: ''
      })
      onSuccess?.()
    },
    onError: () => {
      toastService.error(t('transactions.saveError'))
    }
  })

  // Get primary wallet or first wallet if no primary exists
  const defaultWallet = wallets.find(w => w.is_primary) || wallets[0]

  const [formData, setFormData] = useState({
    type: initialData?.type || ('expense' as TransactionType),
    amount: initialData?.amount?.toString() || '',
    wallet_id: initialData?.wallet_id || defaultWallet?.id || '',
    category: initialData?.category_id || ('' as TransactionCategory),
    date:
      initialData?.date?.split('T')[0] ||
      new Date().toISOString().split('T')[0],
    description: initialData?.description || ''
  })

  if (wallets.length === 0) {
    return (
      <Card className={cn('mx-auto')}>
        <CardContent className='pt-6 px-4 text-center'>
          <p className='text-lg mb-4'>{t('wallets.createFirstWallet')}</p>
          <Link href='/wallets' onClick={onCancel}>
            <Button>{t('wallets.create')}</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Find the category ID from the selected category name
    const selectedCategory = categories.find(
      cat => cat.name === formData.category
    )

    // If no category is selected, find the "Other" category
    const otherCategory = categories.find(cat => cat.name === 'Other')

    const transaction: CreateTransactionDTO = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      wallet_id: formData.wallet_id,
      category_id: selectedCategory?.id || otherCategory?.id || '', // Use "Other" category as fallback
      label: 'Personal',
      date: new Date(formData.date).toISOString(),
      description: formData.description
    }

    // Only proceed if we have a valid category_id
    if (!transaction.category_id) {
      toastService.error(t('transactions.selectCategory'))
      return
    }

    transactionMutation.mutate(transaction)
  }

  return (
    <Card className={cn('mx-auto')}>
      <form onSubmit={handleSubmit}>
        <CardContent className='space-y-3 pt-6 px-4'>
          <Tabs
            defaultValue='expense'
            value={formData.type}
            onValueChange={value =>
              setFormData({ ...formData, type: value as TransactionType })
            }
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='expense' className='text-base'>
                {t('transactions.expense')}
              </TabsTrigger>
              <TabsTrigger value='income' className='text-base'>
                {t('transactions.income')}
              </TabsTrigger>
              <TabsTrigger value='transfer' className='text-base'>
                {t('transactions.transfer')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div
            className={cn(
              'grid gap-4',
              variant === 'default'
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            )}
          >
            <Input
              id='amount'
              type='number'
              placeholder={t('transactions.amount', {
                currency:
                  wallets.find(w => w.id === formData.wallet_id)?.currency ||
                  '$'
              })}
              value={formData.amount}
              onChange={e =>
                setFormData({ ...formData, amount: e.target.value })
              }
              step='0.01'
              min='0'
              required
              className='text-base h-12'
            />
            <Select
              value={formData.wallet_id}
              onValueChange={value =>
                setFormData({ ...formData, wallet_id: value })
              }
            >
              <SelectTrigger id='wallet' className='h-12'>
                <SelectValue placeholder={t('wallets.selectWallet')} />
              </SelectTrigger>
              <SelectContent>
                {wallets.map(wallet => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id='description'
              placeholder={t('transactions.description')}
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              className='text-base h-12'
            />
            <Input
              id='date'
              type='date'
              value={formData.date}
              onChange={e =>
                setFormData({
                  ...formData,
                  date: e.target.value
                })
              }
              required
              className='text-base h-12 w-full min-w-0'
              onClick={e => {
                ;(e.target as HTMLInputElement).showPicker()
              }}
            />
          </div>

          <div
            className={cn(
              'grid gap-1.5',
              variant === 'default'
                ? 'grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
            )}
          >
            {categories
              .filter(category => category.is_active)
              .map(category => (
                <button
                  key={category.id}
                  type='button'
                  onClick={() =>
                    setFormData({
                      ...formData,
                      category: category.name as TransactionCategory
                    })
                  }
                  className={cn(
                    'transition-all duration-200 ease-in-out',
                    formData.category === category.name ? 'scale-102' : ''
                  )}
                >
                  <Badge
                    variant={
                      formData.category === category.name
                        ? 'default'
                        : 'outline'
                    }
                    className={cn(
                      'w-full justify-start gap-2 py-2 px-3 text-sm',
                      formData.category === category.name
                        ? 'bg-primary text-primary-foreground'
                        : ''
                    )}
                  >
                    {category.icon && (
                      <span className='text-base'>{category.icon}</span>
                    )}
                    {category.name}
                  </Badge>
                </button>
              ))}
          </div>
        </CardContent>

        <CardFooter className='flex justify-end gap-2 px-4 pb-4'>
          {onCancel && (
            <Button type='button' variant='outline' onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
          <Button type='submit' disabled={transactionMutation.isPending}>
            {initialData ? t('common.save') : t('common.add')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
