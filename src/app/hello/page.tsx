'use client'

import { QuickTransactionForm } from '@/components/transaction/QuickTransactionForm'
import { RecentTransactions } from '@/components/transaction/RecentTransactions'
import { ExpensePieChart } from '@/components/ui/ExpensePieChart'
import { useState } from 'react'
import { TransactionCategory } from '@/lib/types/transaction'

export default function Hello () {
  const [selectedCategory, setSelectedCategory] =
    useState<TransactionCategory>()

  return (
    <div className='container px-4 py-4 sm:py-6 mx-auto max-w-7xl'>
      <div className='grid grid-cols-12 gap-6'>
        <div className='col-span-12 lg:col-span-5 space-y-6'>
          <ExpensePieChart
            onCategorySelect={setSelectedCategory}
            selectedCategory={selectedCategory}
          />
          <QuickTransactionForm />
        </div>

        <div className='col-span-12 lg:col-span-7'>
          <RecentTransactions
            selectedCategory={selectedCategory}
            onResetCategory={() => setSelectedCategory(undefined)}
          />
        </div>
      </div>
    </div>
  )
}
