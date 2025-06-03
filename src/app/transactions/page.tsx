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
import { toastService } from '@/lib/services/toast'
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
import { transactionService } from '@/lib/services/transaction'

function TransactionsContent () {
  const { user, loading } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<
    TransactionCategory | ''
  >('')
  const [selectedWalletId, setSelectedWalletId] = useState<string | 'all'>(
    'all'
  )
  const [isMonobankLoading, setIsMonobankLoading] = useState(false)
  const [showWalletDialog, setShowWalletDialog] = useState(false)
  const [monobankTransactions, setMonobankTransactions] = useState<
    MonobankTransaction[]
  >([])
  const [wallets, setWallets] = useState<{ id: string; name: string }[]>([])
  const [showFilters, setShowFilters] = useState(false)

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
    if (!user) return

    // Handle URL parameters when component mounts
    const dateParam = searchParams.get('date')
    const walletParam = searchParams.get('wallet')

    if (dateParam) {
      const date = new Date(dateParam)
      // Check if the date is valid before setting it
      if (!isNaN(date.getTime())) {
        setSelectedDate(date)
      }
    }

    if (walletParam) {
      setSelectedWalletId(walletParam)
    }
  }, [searchParams])

  // TODO: needed for wallet filters, could be stored in store
  // useEffect(() => {
  //   async function fetchWallets () {
  //     if (!user) return
  //     const wallets = await transactionService.fetchWallets(user.id)
  //     setWallets(wallets)
  //   }

  //   if (user) {
  //     fetchWallets()
  //   }
  // }, [user])

  // Update URL when filters change
  const updateUrlWithFilters = (
    date: Date | undefined,
    wallet: string | 'all'
  ) => {
    const params = new URLSearchParams(searchParams.toString())

    if (date) {
      params.set('date', date.toISOString().split('T')[0])
    } else {
      params.delete('date')
    }

    if (wallet && wallet !== 'all') {
      params.set('wallet', wallet)
    } else {
      params.delete('wallet')
    }

    const query = params.toString() ? `?${params.toString()}` : ''
    router.push(`/transactions${query}`, { scroll: false })
  }

  // Update the handleDateChange function
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
    updateUrlWithFilters(date, selectedWalletId)
  }

  // Update the wallet selection handler
  const handleWalletChange = (value: string) => {
    setSelectedWalletId(value)
    updateUrlWithFilters(selectedDate, value)
  }

  // Update the clear filters function
  const handleClearFilters = () => {
    setSelectedDate(undefined)
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedWalletId('all')

    // Clear URL parameters
    router.push('/transactions', { scroll: false })
  }

  const handleSaveTransactions = async () => {
    if (!selectedWalletId) {
      toastService.error('Please select a wallet')
      return
    }

    setIsMonobankLoading(true)
    try {
      const timestamp = Date.now()
      await MonobankService.saveTransactions(
        monobankTransactions,
        selectedWalletId
      )

      const newTransactionsCount =
        await transactionService.countNewTransactions(
          selectedWalletId,
          timestamp
        )

      if (newTransactionsCount > 0) {
        toastService.success(`Saved ${newTransactionsCount} new transactions`)
      }

      setShowWalletDialog(false)
      setMonobankTransactions([])
      setSelectedWalletId('')
      setRefreshTrigger(Date.now())
    } catch (error) {
      console.error('Failed to import transactions:', error)
      toastService.error(
        'Failed to import transactions. Please check the file format.'
      )
    } finally {
      setIsMonobankLoading(false)
    }
  }

  const handleTransactionDelete = async (transactionId: string) => {
    try {
      const transaction = await transactionService.getTransactionForDelete(
        transactionId
      )
      if (!transaction) throw new Error('Transaction not found')

      await transactionService.softDelete(transaction.id)
      await transactionService.delete(transaction.id)

      toastService.success('Transaction removed')
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Failed to remove transaction:', error)
      toastService.error('Failed to remove transaction')
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
      {/* <Card> */}
      {/* <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle
              className='cursor-pointer hover:text-primary transition-colors'
              onClick={() => setShowFilters(!showFilters)}
            >
              Transactions filters {showFilters ? '▼' : '▶'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className='mb-6'>
            {showFilters && (
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
                            selectedCategory === category
                              ? 'selected'
                              : 'secondary'
                          }
                          className={cn(
                            'w-full py-1.5 text-sm cursor-pointer hover:opacity-90 flex items-center justify-center',
                            selectedCategory === category ? 'shadow-sm' : ''
                          )}
                        >
                          <span className='mr-1.5'>
                            {categoryIcons[category]}
                          </span>
                          <span className='truncate'>{category}</span>
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className='flex justify-between items-center mb-6'>
              <div className='flex items-center gap-4'>
                <h1 className='text-2xl font-bold'>Transactions</h1>
                <Select
                  value={selectedWalletId}
                  onValueChange={handleWalletChange}
                >
                  <SelectTrigger className='w-[200px]'>
                    <SelectValue placeholder='Filter by wallet' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Wallets</SelectItem>
                    {wallets.map(wallet => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setShowForm(true)}>Add Transaction</Button>
            </div>
            {showForm && (
              <div className='mb-6'>
                <QuickTransactionForm variant='wide' />
                <div className='mt-4 text-center'>
                  <Button variant='ghost' onClick={() => setShowForm(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
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
          </div>
        </CardContent> */}
      {/* </Card> */}
      <TransactionList
        key={`${selectedDate?.toISOString()}-${searchQuery}-${selectedCategory}-${selectedWalletId}-${refreshTrigger}`}
        selectedDate={selectedDate}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        selectedWalletId={selectedWalletId}
        onDelete={handleTransactionDelete}
      />
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
