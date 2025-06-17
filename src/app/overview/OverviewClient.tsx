'use client'

import { RecentTransactions } from '@/components/transaction/RecentTransactions'
import { ExpensePieChart } from '@/components/ui/ExpensePieChart'
import { useState } from 'react'
import { TransactionCategory } from '@/lib/types/transaction'

export default function OverviewClient () {
  const [selectedCategory, setSelectedCategory] =
    useState<TransactionCategory>()
  const [selectedWalletId, setSelectedWalletId] = useState<string>('')

  return (
    <div
      className='container px-0 sm:px-4 md:px-6 ml-0 sm:ml-10 max-w-7xl'
      style={{ minWidth: 'calc(100% - 5vw)' }}
    >
      <div className='grid grid-cols-12 gap-6'>
        <div className='col-span-12 lg:col-span-5 space-y-6'>
          <ExpensePieChart
            onCategorySelect={setSelectedCategory}
            selectedCategory={selectedCategory}
            setSelectedWalletId={setSelectedWalletId}
          />
        </div>

        <div className='col-span-12 lg:col-span-7'>
          <RecentTransactions
            selectedCategory={selectedCategory}
            onResetCategory={() => setSelectedCategory(undefined)}
            selectedWalletId={selectedWalletId}
          />
        </div>
      </div>
    </div>
  )
}
