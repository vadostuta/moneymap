'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

// Define the transaction interface that can be used across the app
export interface TransactionItemProps {
  transaction: {
    id: string
    date: string
    type: string
    amount: number
    description?: string
    category?: string
    wallet?: { name: string }
    label?: string
  }
  showActions?: boolean
  onEdit?: (transaction: TransactionItemProps['transaction']) => void
  onDelete?: (id: string) => void
}

export function TransactionItem ({
  transaction,
  showActions = false,
  onEdit,
  onDelete
}: TransactionItemProps) {
  return (
    <div className='flex justify-between items-center p-3 border rounded-lg'>
      <div>
        <p className='font-medium'>{transaction.description}</p>
        <p className='text-sm text-muted-foreground'>
          {transaction.category || transaction.type}
        </p>
        <p className='text-xs text-gray-400'>
          {new Date(transaction.date).toLocaleDateString()}
        </p>
        {transaction.wallet && (
          <p className='text-xs text-gray-400'>
            Wallet: {transaction.wallet.name}
          </p>
        )}
        {transaction.label && (
          <p className='text-xs text-gray-400'>Label: {transaction.label}</p>
        )}
      </div>
      <div className='flex items-center gap-4'>
        <p
          className={`font-bold ${
            transaction.type === 'expense' ? 'text-white' : 'text-green-500'
          }`}
        >
          {transaction.type === 'expense' ? '-' : '+'} $
          {transaction.amount.toLocaleString()}
        </p>

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
              onClick={() => onDelete(transaction.id)}
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
  )
}
