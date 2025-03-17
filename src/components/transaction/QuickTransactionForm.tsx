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
  CreateTransactionDTO
} from '@/lib/types/transaction'
import { Wallet } from '@/lib/types/wallet'
import { transactionService } from '@/lib/services/transaction'
import { walletService } from '@/lib/services/wallet'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

export function QuickTransactionForm () {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [formData, setFormData] = useState({
    type: 'expense' as TransactionType,
    amount: '',
    wallet_id: '',
    category: '' as TransactionCategory,
    date: new Date().toISOString().split('T')[0],
    description: ''
  })

  const categories: TransactionCategory[] = [
    'Food & Dining',
    'Shopping',
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
    'Food & Dining': '🍽️',
    Shopping: '🛍️',
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
    loadWallets()
  }, [])

  const loadWallets = async () => {
    try {
      const data = await walletService.getAll()
      setWallets(data)
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, wallet_id: data[0].id }))
      }
    } catch (error) {
      console.error('Failed to load wallets:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const transaction: CreateTransactionDTO = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        wallet_id: formData.wallet_id,
        category: formData.category || ('Other' as TransactionCategory),
        label: 'Personal',
        date: new Date(formData.date).toISOString(),
        description: formData.description
      }

      await transactionService.create(transaction)

      // Add success toast
      toast({
        title: 'Transaction added successfully',
        description: `${
          formData.type === 'expense' ? 'Expense' : 'Income'
        } of ${formData.amount} has been recorded.`
      })

      // Reset form
      setFormData({
        type: 'expense',
        amount: '',
        wallet_id: wallets[0]?.id || '',
        category: '' as TransactionCategory,
        date: new Date().toISOString().split('T')[0],
        description: ''
      })
    } catch (error) {
      console.error('Failed to create transaction:', error)
      // Optionally add error toast
      toast({
        title: 'Failed to add transaction',
        description: 'Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className='w-full max-w-md mx-auto'>
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

          <div className='grid grid-cols-2 gap-4'>
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
          </div>

          <div className='grid grid-cols-3 gap-1.5'>
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

          <div className='grid grid-cols-2 gap-4'>
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
              className='text-base h-12'
              onClick={e => {
                ;(e.target as HTMLInputElement).showPicker()
              }}
            />
          </div>

          <CardFooter className='px-0 pb-0'>
            <Button
              type='submit'
              className='w-full h-12 text-base font-medium'
              disabled={loading}
            >
              <Plus className='mr-2 h-5 w-5' />
              {loading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </CardFooter>
        </CardContent>
      </form>
    </Card>
  )
}
