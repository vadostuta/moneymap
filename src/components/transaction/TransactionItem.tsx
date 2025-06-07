'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Transaction, TransactionCategory } from '@/lib/types/transaction'

// Define the transaction interface that can be used across the app
export interface TransactionItemProps {
  transaction: Transaction
  showActions?: boolean
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
}

// Add categoryIcons map
const categoryIcons: Record<TransactionCategory, string> = {
  'Restaurants & Cafés': '🍽️',
  Clothing: '👕',
  Transportation: '🚗',
  'Bills & Utilities': '📱',
  Entertainment: '🎮',
  Healthcare: '🏥',
  Education: '📚',
  Travel: '✈️',
  Presents: '🎁',
  Other: '📌',
  Donations: '🤝',
  Subscriptions: '📅',
  Groceries: '🛒',
  Car: '🚘',
  Home: '🏠',
  Taxes: '📝',
  Electronics: '💻',
  Children: '👶',
  Parents: '👨‍👩‍👧‍👦',
  Pets: '🐾',
  Sport: '🏋️',
  'Style and Beauty': '💇',
  Extra: '➕',
  Salary: '💰'
}

export function TransactionItem ({
  transaction,
  showActions = false,
  onEdit,
  onDelete
}: TransactionItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const formatAmount = (
    amount: number,
    currency: string | undefined,
    type: string
  ) => {
    if (!currency) {
      console.warn('Missing currency for transaction:', transaction.id)
      return `${type === 'expense' ? '-' : '+'}${amount.toFixed(2)}`
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        signDisplay: 'always'
      }).format(type === 'expense' ? -Math.abs(amount) : Math.abs(amount))
    } catch (error) {
      console.error('Currency formatting error:', {
        amount,
        currency,
        type,
        error
      })
      return `${type === 'expense' ? '-' : '+'}${amount.toFixed(2)} ${currency}`
    }
  }

  const handleDelete = () => {
    onDelete?.(transaction.id)
    setShowDeleteDialog(false)
  }

  // Also log the full transaction object to debug
  // console.log('Transaction:', transaction)
  // console.log('Wallet data:', transaction.wallet)

  return (
    <>
      <div className='flex justify-between items-center p-3 border rounded-lg'>
        <div>
          <p className='font-medium'>{transaction.description}</p>
          <p className='text-sm text-muted-foreground flex items-center gap-1.5'>
            <span>
              {categoryIcons[transaction.category as TransactionCategory]}
            </span>
            <span>{transaction.category || transaction.type}</span>
          </p>
          <p className='text-xs text-gray-400'>
            {new Date(transaction.date).toLocaleDateString()}
          </p>
          {transaction.wallet && (
            <p className='text-xs text-gray-400'>
              Wallet: {transaction.wallet.name}
              {process.env.NODE_ENV === 'development' &&
                ` (ID: ${transaction.wallet.id})`}
            </p>
          )}
        </div>
        <div className='flex items-center gap-4'>
          <div
            className={`text-base font-medium ${
              transaction.type === 'income' ? 'text-green-500' : ''
            }`}
          >
            {formatAmount(
              transaction.amount,
              transaction.wallet?.currency,
              transaction.type
            )}
          </div>

          {showActions && onEdit && onDelete && (
            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0 rounded-full'
                onClick={() => onEdit(transaction)}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'></path>
                </svg>
                <span className='sr-only'>Edit</span>
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                onClick={() => setShowDeleteDialog(true)}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M3 6h18'></path>
                  <path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6'></path>
                  <path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'></path>
                </svg>
                <span className='sr-only'>Delete</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-red-500 hover:bg-red-600'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
