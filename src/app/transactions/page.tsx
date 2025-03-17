'use client'

import { useEffect, useState, Suspense } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { TransactionList } from '@/components/transaction/TransactionList'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { TransactionCategory } from '@/lib/types/transaction'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { QuickTransactionForm } from '@/components/transaction/QuickTransactionForm'

function TransactionsContent () {
  const { user, loading } = useAuth()
  const [showForm, setShowForm] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const searchParams = useSearchParams()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<
    TransactionCategory | ''
  >('')

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

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
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
                  onClick={() => handleDateChange(undefined)}
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
                  onClick={() => setSearchQuery('')}
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
            key={`${selectedDate?.toISOString()}-${searchQuery}-${selectedCategory}`}
            selectedDate={selectedDate}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
          />
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
