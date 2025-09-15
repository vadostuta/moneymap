'use client'

import { RecentTransactions } from '@/components/transaction/RecentTransactions'
import { ExpensePieChart } from '@/components/ui/ExpensePieChart'
import { useState } from 'react'
import { TransactionCategory } from '@/lib/types/transaction'
import { useWallet } from '@/contexts/wallet-context'
import { useQuery } from '@tanstack/react-query'
import { transactionService } from '@/lib/services/transaction'

export default function OverviewClient () {
  const [selectedCategory, setSelectedCategory] =
    useState<TransactionCategory>()
  const { selectedWallet, isAllWalletsSelected, wallets } = useWallet()
  const selectedWalletId = selectedWallet?.id || ''

  // Check which wallets have transactions for the current month and sort by transaction diversity
  const { data: walletsWithTransactions = [] } = useQuery({
    queryKey: ['wallets-with-transactions'],
    queryFn: async () => {
      if (!isAllWalletsSelected) return []

      const walletChecks = await Promise.all(
        wallets.map(async wallet => {
          try {
            // Check both expenses and income for this wallet
            const [expenses, income] = await Promise.all([
              transactionService.getCurrentMonthExpensesByCategory(wallet.id),
              transactionService.getCurrentMonthIncomeByCategory(wallet.id)
            ])

            const hasExpenses =
              expenses.length > 0 && expenses.some(item => item.amount > 0)
            const hasIncome =
              income.length > 0 && income.some(item => item.amount > 0)

            // Calculate total transaction diversity (number of unique categories)
            const expenseCategories = new Set(
              expenses.map(item => item.category_id)
            ).size
            const incomeCategories = new Set(
              income.map(item => item.category_id)
            ).size
            const totalCategories = expenseCategories + incomeCategories

            // Calculate total transaction amount for secondary sorting
            const totalExpenseAmount = expenses.reduce(
              (sum, item) => sum + item.amount,
              0
            )
            const totalIncomeAmount = income.reduce(
              (sum, item) => sum + item.amount,
              0
            )
            const totalAmount = totalExpenseAmount + totalIncomeAmount

            return {
              wallet,
              hasTransactions: hasExpenses || hasIncome,
              totalCategories,
              totalAmount
            }
          } catch (error) {
            console.error(
              `Error checking transactions for wallet ${wallet.id}:`,
              error
            )
            return {
              wallet,
              hasTransactions: false,
              totalCategories: 0,
              totalAmount: 0
            }
          }
        })
      )

      // Filter wallets with transactions and sort by diversity (categories) first, then by amount
      return walletChecks
        .filter(check => check.hasTransactions)
        .sort((a, b) => {
          // Primary sort: by number of transaction categories (more diverse = higher)
          if (b.totalCategories !== a.totalCategories) {
            return b.totalCategories - a.totalCategories
          }
          // Secondary sort: by total transaction amount (higher amount = higher)
          return b.totalAmount - a.totalAmount
        })
        .map(check => check.wallet)
    },
    enabled: isAllWalletsSelected && wallets.length > 0
  })

  return (
    <div
      className='container px-0 sm:px-4 md:px-6 ml-0 sm:ml-2 max-w-7xl'
      style={{ minWidth: 'calc(100% - 5vw)' }}
    >
      <div className='grid grid-cols-12 gap-6'>
        <div className='col-span-12 lg:col-span-5 space-y-6'>
          {isAllWalletsSelected ? (
            <div className='space-y-6'>
              {walletsWithTransactions.length > 0 ? (
                walletsWithTransactions.map(wallet => (
                  <ExpensePieChart
                    key={wallet.id}
                    wallet={wallet}
                    showWalletName={true}
                    onCategorySelect={setSelectedCategory}
                    selectedCategory={selectedCategory}
                  />
                ))
              ) : (
                <div className='text-center text-muted-foreground py-8'>
                  No transactions found for any wallet this month
                </div>
              )}
            </div>
          ) : (
            <ExpensePieChart
              onCategorySelect={setSelectedCategory}
              selectedCategory={selectedCategory}
            />
          )}
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
