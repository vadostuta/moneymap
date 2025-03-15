'use client'

import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RevenueCard } from '@/components/ui/RevenueCard'

export default function DashboardPage () {
  const { user, loading } = useAuth()
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    totalIncome: 0
  })

  useEffect(() => {
    if (user) {
      fetchSummaryData()
    }
  }, [user])

  async function fetchSummaryData () {
    try {
      // Fetch total expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user?.id)
        .eq('type', 'expense')

      // Fetch total income
      const { data: income, error: incomeError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user?.id)
        .eq('type', 'income')

      if (expensesError || incomeError) {
        console.error(
          'Error fetching summary data:',
          expensesError || incomeError
        )
        return
      }

      // Calculate totals
      const totalExpenses =
        expenses?.reduce((sum, item) => sum + item.amount, 0) || 0
      const totalIncome =
        income?.reduce((sum, item) => sum + item.amount, 0) || 0

      setSummary({ totalExpenses, totalIncome })
    } catch (error) {
      console.error('Failed to fetch summary data:', error)
    }
  }

  if (loading) {
    return (
      <div className='flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 sm:p-6 md:p-8'>
        <div className='text-center'>
          <p className='text-lg'>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className='flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 sm:p-6 md:p-8'>
        <div className='text-center'>
          <p className='text-lg'>Please log in to view your dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='container px-4 py-4 sm:py-6 mx-auto max-w-7xl'>
      <h1 className='text-xl sm:text-2xl font-bold mb-4 sm:mb-6'>Dashboard</h1>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6'>
        <Card className='w-full'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base sm:text-lg'>
              Total expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-lg sm:text-xl font-bold text-red-500'>
              - ${summary.totalExpenses.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className='w-full'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base sm:text-lg'>Total income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-lg sm:text-xl font-bold text-green-500'>
              + ${summary.totalIncome.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className='w-full'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base sm:text-lg'>Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-lg sm:text-xl font-bold ${
                summary.totalIncome - summary.totalExpenses >= 0
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}
            >
              ${(summary.totalIncome - summary.totalExpenses).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='mb-4 sm:mb-6'>
        <RevenueCard />
      </div>
    </div>
  )
}
