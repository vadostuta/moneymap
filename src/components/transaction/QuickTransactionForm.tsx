'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
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
  const queryClient = useQueryClient()

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: walletService.getAll
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
      toastService.success(
        initialData
          ? 'Transaction updated successfully'
          : 'Transaction added successfully'
      )
      setFormData({
        type: 'expense',
        amount: '',
        wallet_id: formData.wallet_id, // Keep the same wallet
        category: '' as TransactionCategory,
        date: new Date().toISOString().split('T')[0],
        description: ''
      })
      onSuccess?.()
    },
    onError: () => {
      toastService.error('Failed to save transaction. Please try again.')
    }
  })

  const [formData, setFormData] = useState({
    type: initialData?.type || ('expense' as TransactionType),
    amount: initialData?.amount?.toString() || '',
    wallet_id: initialData?.wallet_id || '',
    category: initialData?.category || ('' as TransactionCategory),
    date:
      initialData?.date?.split('T')[0] ||
      new Date().toISOString().split('T')[0],
    description: initialData?.description || ''
  })

  const categories: TransactionCategory[] = [
    'Restaurants & Cafés',
    'Clothing',
    'Transportation',
    'Bills & Utilities',
    'Entertainment',
    'Healthcare',
    'Education',
    'Travel',
    'Presents',
    'Other',
    'Donations',
    'Subscriptions'
  ]

  const categoryIcons: Record<TransactionCategory, React.ReactNode> = {
    'Restaurants & Cafés': '🍽️',
    Clothing: '🛍️',
    Transportation: '🚗',
    'Bills & Utilities': '📱',
    Entertainment: '🎮',
    Healthcare: '🏥',
    Education: '📚',
    Travel: '✈️',
    Presents: '🎁',
    Other: '📌',
    Donations: '🤝',
    Subscriptions: '📅'
  }

  useEffect(() => {
    if (!formData.wallet_id && wallets.length > 0) {
      const primaryWallet = wallets.find(w => w.is_primary) || wallets[0]
      setFormData(prev => ({ ...prev, wallet_id: primaryWallet.id }))
    }
  }, [wallets])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const transaction: CreateTransactionDTO = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      wallet_id: formData.wallet_id,
      category: formData.category || ('Other' as TransactionCategory),
      label: 'Personal',
      date: new Date(formData.date).toISOString(),
      description: formData.description
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
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='expense' className='text-base'>
                Expense
              </TabsTrigger>
              <TabsTrigger value='income' className='text-base'>
                Income
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div
            className={cn(
              'grid gap-4',
              variant === 'default'
                ? 'grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            )}
          >
            <Input
              id='amount'
              type='number'
              placeholder={`Amount (${
                wallets.find(w => w.id === formData.wallet_id)?.currency || '$'
              })`}
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
                <SelectValue placeholder='Select wallet' />
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
              placeholder='Description'
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
              className='text-base h-12 w-full'
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
            {categories.map(category => (
              <button
                key={category}
                type='button'
                onClick={() => setFormData({ ...formData, category })}
                className={cn(
                  'transition-all duration-200 ease-in-out',
                  formData.category === category ? 'scale-102' : ''
                )}
              >
                <Badge
                  variant={
                    formData.category === category ? 'selected' : 'secondary'
                  }
                  className={cn(
                    'w-full py-1.5 text-sm cursor-pointer hover:opacity-90 flex items-center justify-center',
                    formData.category === category ? 'shadow-sm' : ''
                  )}
                >
                  <span className='mr-1.5'>{categoryIcons[category]}</span>
                  <span className='truncate'>{category}</span>
                </Badge>
              </button>
            ))}
          </div>

          <CardFooter className='px-0 pb-0'>
            <div className='flex w-full gap-2'>
              {onCancel && (
                <Button
                  type='button'
                  variant='ghost'
                  onClick={onCancel}
                  className='flex-1'
                >
                  Cancel
                </Button>
              )}
              <Button
                type='submit'
                className='flex-1'
                disabled={transactionMutation.isPending}
              >
                <Plus className='mr-2 h-5 w-5' />
                {transactionMutation.isPending
                  ? 'Saving...'
                  : initialData
                  ? 'Update Transaction'
                  : 'Add Transaction'}
              </Button>
            </div>
          </CardFooter>
        </CardContent>
      </form>
    </Card>
  )
}
