'use client'

import { useEffect, useState, Suspense } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { TransactionList } from '@/components/transaction/TransactionList'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { TransactionCategory } from '@/lib/types/transaction'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { QuickTransactionForm } from '@/components/transaction/QuickTransactionForm'
import { MonobankService } from '@/lib/services/monobank'
import { toast } from 'react-hot-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { MonobankTransaction } from '@/lib/services/monobank'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { addDays, subDays } from 'date-fns'

function TransactionsContent () {
  const { user, loading } = useAuth()
  const [showForm, setShowForm] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<
    TransactionCategory | ''
  >('')
  const [isMonobankLoading, setIsMonobankLoading] = useState(false)
  const [showWalletDialog, setShowWalletDialog] = useState(false)
  const [selectedWalletId, setSelectedWalletId] = useState<string>('')
  const [monobankTransactions, setMonobankTransactions] = useState<
    MonobankTransaction[]
  >([])
  const [wallets, setWallets] = useState<{ id: string; name: string }[]>([])

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

  const categoryIcons: Record<TransactionCategory, string> = {
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
    // Get date from URL params when component mounts
    const dateParam = searchParams.get('date')
    if (dateParam) {
      const date = new Date(dateParam)
      setSelectedDate(date)
    }
  }, [searchParams])

  useEffect(() => {
    async function fetchWallets () {
      const { data, error } = await supabase
        .from('wallets')
        .select('id, name')
        .eq('user_id', user?.id)

      if (!error && data) {
        setWallets(data)
      }
    }

    if (user) {
      fetchWallets()
    }
  }, [user])

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  const handleSaveTransactions = async () => {
    if (!selectedWalletId) {
      toast.error('Please select a wallet')
      return
    }

    setIsMonobankLoading(true)
    try {
      const before = Date.now()
      await MonobankService.saveTransactions(
        monobankTransactions,
        selectedWalletId
      )

      // Fetch the count of transactions created after our save operation started
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('wallet_id', selectedWalletId)
        .gt('created_at', new Date(before).toISOString())

      toast.success(`Saved ${count} new transactions`)
      setShowWalletDialog(false)
      setMonobankTransactions([])
      setSelectedWalletId('')

      // Force refresh the transaction list
      setRefreshTrigger(Date.now())
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save transactions'
      )
    } finally {
      setIsMonobankLoading(false)
    }
  }

  const handleClearFilters = () => {
    // Clear the local state
    handleDateChange(undefined)
    setSearchQuery('')
    setSelectedCategory('')

    // Remove query parameters from URL
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.delete('date')
    const search = current.toString()
    const query = search ? `?${search}` : ''

    router.push(`/transactions${query}`)
  }

  const handleTransactionDelete = async (transactionId: string) => {
    try {
      // First get the monobank_id
      const { data: transaction } = await supabase
        .from('transactions')
        .select('monobank_id')
        .eq('id', transactionId)
        .single()

      if (!transaction) throw new Error('Transaction not found')

      // Then update is_deleted
      const { error } = await supabase
        .from('transactions')
        .update({ is_deleted: true })
        .eq('id', transactionId)

      if (error) throw error

      toast.success('Transaction removed')
      setRefreshTrigger(Date.now())
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Failed to remove transaction')
    }
  }

  if (loading) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-24'>
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-24'>
        Please log in to manage your transactions.
      </div>
    )
  }

  return (
    <div className='container mx-auto py-6'>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='mb-6 space-y-4'>
            <div className='flex items-center gap-4'>
              <DatePicker
                date={selectedDate}
                onSelect={handleDateChange}
                placeholder='Filter by date'
              />
              {selectedDate && (
                <button
                  onClick={handleClearFilters}
                  className='text-sm text-muted-foreground hover:text-primary'
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className='flex items-center gap-4'>
              <Input
                placeholder='Search by description...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='max-w-sm'
              />
              {searchQuery && (
                <button
                  onClick={handleClearFilters}
                  className='text-sm text-muted-foreground hover:text-primary'
                >
                  Clear search
                </button>
              )}
            </div>
            <div className='space-y-2'>
              <div className='text-sm text-muted-foreground'>
                Filter by category:
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5'>
                {categories.map(category => (
                  <button
                    key={category}
                    type='button'
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === category ? '' : category
                      )
                    }
                    className={cn(
                      'transition-all duration-200 ease-in-out',
                      selectedCategory === category ? 'scale-102' : ''
                    )}
                  >
                    <Badge
                      variant={
                        selectedCategory === category ? 'selected' : 'secondary'
                      }
                      className={cn(
                        'w-full py-1.5 text-sm cursor-pointer hover:opacity-90 flex items-center justify-center',
                        selectedCategory === category ? 'shadow-sm' : ''
                      )}
                    >
                      <span className='mr-1.5'>{categoryIcons[category]}</span>
                      <span className='truncate'>{category}</span>
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className='flex justify-between items-center mb-6'>
            <h1 className='text-2xl font-bold'>Transactions</h1>
            <Button onClick={() => setShowForm(true)}>Add Transaction</Button>
          </div>

          {showForm ? (
            <div className='mb-6'>
              <QuickTransactionForm variant='wide' />
              <div className='mt-4 text-center'>
                <Button variant='ghost' onClick={() => setShowForm(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}

          <TransactionList
            key={`${selectedDate?.toISOString()}-${searchQuery}-${selectedCategory}-${refreshTrigger}`}
            selectedDate={selectedDate}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onDelete={handleTransactionDelete}
          />

          <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Wallet</DialogTitle>
                <DialogDescription>
                  Choose which wallet to save {monobankTransactions.length}{' '}
                  transactions to
                </DialogDescription>
              </DialogHeader>
              <Select
                value={selectedWalletId}
                onValueChange={setSelectedWalletId}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a wallet' />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map(wallet => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className='flex justify-end gap-4'>
                <Button
                  variant='outline'
                  onClick={() => setShowWalletDialog(false)}
                  disabled={isMonobankLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveTransactions}
                  disabled={!selectedWalletId || isMonobankLoading}
                >
                  {isMonobankLoading ? 'Saving...' : 'Save Transactions'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TransactionsPage () {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-24'>
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-24'>
        Please log in to manage your transactions.
      </div>
    )
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TransactionsContent />
    </Suspense>
  )
}
