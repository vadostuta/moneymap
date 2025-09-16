import { supabase } from '@/lib/supabase/client'
import {
  Transaction,
  CreateTransactionDTO,
  TransactionType
} from '@/lib/types/transaction'

export const transactionService = {
  // Create a new transaction
  async create (transaction: CreateTransactionDTO): Promise<Transaction | null> {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) throw new Error('User must be logged in')

      console.log('Authenticated user:', user.id)
      console.log('Creating transaction:', {
        ...transaction,
        user_id: user.id,
        date: transaction.date || new Date().toISOString()
      })

      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            ...transaction,
            user_id: user.id,
            date: transaction.date || new Date().toISOString(),
            category_id: transaction.category_id
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Transaction created:', data)
      return data
    } catch (error) {
      console.error('Transaction creation failed:', error)
      throw error
    }
  },

  // Get all transactions for the current user
  async getAll (): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, wallet:wallets(id, name)')
      .eq('is_deleted', false)
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get transactions for a specific wallet
  async getByWalletId (walletId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, wallet:wallets(id, name)')
      .eq('wallet_id', walletId)
      .eq('is_deleted', false)
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get a specific transaction by ID
  async getById (id: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, wallet:wallets(id, name)')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error) throw error
    return data
  },

  // Update a transaction
  async update (
    transactionId: string,
    updates: Partial<{
      amount: number
      description: string
      date: string
      type: TransactionType
      category_id: string
      wallet_id: string
      is_hidden: boolean
    }>
  ): Promise<void> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    // If we're updating the category, we need to verify the category exists
    if (updates.category_id) {
      // Check if the category exists by ID
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', updates.category_id)
        .single()

      if (categoryError || !category) {
        throw new Error('Category not found')
      }
    }

    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .eq('user_id', user.id)

    if (error) throw error
  },

  // Delete a transaction
  async delete (id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .update({ is_deleted: true })
      .eq('id', id)

    if (error) throw error
  },

  // Add new method for fetching summary
  async getSummary (): Promise<{ totalExpenses: number; totalIncome: number }> {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, type, wallet:wallets!inner(id)')
      .eq('wallets.is_deleted', false)

    if (error) throw error

    const transactions = data || []
    return {
      totalExpenses: transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
      totalIncome: transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
    }
  },

  // Add new method for fetching transactions by date range and wallet
  async getByWalletAndDateRange (
    walletId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, wallet:wallets(id, name, currency)')
      .eq('wallet_id', walletId)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .eq('wallets.is_deleted', false)
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  },

  async countNewTransactions (
    walletId: string,
    timestamp: number
  ): Promise<number> {
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_id', walletId)
      .gt('created_at', new Date(timestamp).toISOString())

    return count || 0
  },

  async getFilteredTransactions ({
    userId,
    walletId,
    searchQuery,
    category,
    offset = 0,
    limit, // Remove default value
    showHidden = false,
    minAmount,
    maxAmount,
    fromDate,
    toDate
  }: {
    userId: string
    walletId?: string
    searchQuery?: string
    category?: string
    offset?: number
    limit?: number // Make it optional
    showHidden?: boolean
    minAmount?: number
    maxAmount?: number
    fromDate?: Date
    toDate?: Date
  }): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select('*, wallet:wallets!inner(name, id, currency)')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .eq('wallets.is_deleted', false)

    if (!showHidden) {
      query = query.eq('is_hidden', false)
    }

    if (walletId && walletId !== 'all') {
      query = query.eq('wallet_id', walletId)
    }

    if (searchQuery) {
      query = query.ilike('description', `%${searchQuery}%`)
    }

    if (category) {
      query = query.eq('category_id', category)
    }

    // Add amount range filtering
    if (minAmount !== undefined) {
      query = query.gte('amount', minAmount)
    }

    if (maxAmount !== undefined) {
      query = query.lte('amount', maxAmount)
    }

    // Add date range filtering
    if (fromDate) {
      query = query.gte('date', fromDate.toISOString())
    }

    if (toDate) {
      query = query.lte('date', toDate.toISOString())
    }

    // Only apply range if limit is specified
    if (limit !== undefined) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error } = await query
      .order('date', { ascending: false })
      .order('id', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getTransactionForDelete (id: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, monobank_id')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async softDelete (id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .update({ is_deleted: true })
      .eq('id', id)

    if (error) throw error
  },

  async getMonthlyTransactions (params: {
    walletId: string
    startDate: string
    endDate: string
  }): Promise<Transaction[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('transactions')
      .select('*, wallet:wallets!inner(id, currency)')
      .eq('user_id', user.id)
      .eq('wallet_id', params.walletId)
      .eq('is_deleted', false)
      .eq('wallets.is_deleted', false)
      .gte('date', params.startDate)
      .lte('date', params.endDate)
      .order('date', { ascending: true })

    if (error) throw error
    return data || []
  },

  processTransactionsForChart (
    transactions: Transaction[]
  ): { date: string; expenses: number; income: number }[] {
    const groupedByDate = transactions.reduce(
      (
        acc: Record<string, { expenses: number; income: number }>,
        transaction
      ) => {
        const date = transaction.date.split('T')[0]

        if (!acc[date]) {
          acc[date] = {
            expenses: 0,
            income: 0
          }
        }

        if (transaction.type === 'expense') {
          acc[date].expenses += transaction.amount
        } else if (transaction.type === 'income') {
          acc[date].income += transaction.amount
        }

        return acc
      },
      {}
    )

    return Object.keys(groupedByDate).map(date => ({
      date,
      expenses: groupedByDate[date].expenses,
      income: groupedByDate[date].income
    }))
  },

  async fetchWallets (userId: string): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from('wallets')
      .select('id, name')
      .eq('user_id', userId)
      .eq('is_deleted', false)

    if (error) throw error
    return data || []
  },

  async getCurrentMonthExpensesByCategory (
    walletId?: string
  ): Promise<{ category_id: string; amount: number }[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get first and last day of current month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    let query = supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .gte('date', firstDayOfMonth.toISOString())
      .lte('date', lastDayOfMonth.toISOString())

    // Add wallet filter if specified
    if (walletId && walletId !== 'all') {
      query = query.eq('wallet_id', walletId)
    }

    const { data, error } = await query

    if (error) throw error

    // Group by category_id and sum amounts
    const categoryTotals = (data || []).reduce((acc, transaction) => {
      const categoryId = transaction.category_id || 'uncategorized'
      acc[categoryId] = (acc[categoryId] || 0) + transaction.amount
      return acc
    }, {} as Record<string, number>)

    return Object.entries(categoryTotals).map(([category_id, amount]) => ({
      category_id,
      amount
    }))
  },

  async getCurrentMonthIncomeByCategory (walletId?: string) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get first and last day of current month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    let query = supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', user.id)
      .eq('type', 'income')
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .gte('date', firstDayOfMonth.toISOString())
      .lte('date', lastDayOfMonth.toISOString())

    // Add wallet filter if specified
    if (walletId && walletId !== 'all') {
      query = query.eq('wallet_id', walletId)
    }

    const { data, error } = await query

    if (error) throw error

    // Group by category_id and sum amounts
    const categoryTotals = (data || []).reduce((acc, transaction) => {
      const categoryId = transaction.category_id || 'uncategorized'
      acc[categoryId] = (acc[categoryId] || 0) + transaction.amount
      return acc
    }, {} as Record<string, number>)

    return Object.entries(categoryTotals).map(([category_id, amount]) => ({
      category_id,
      amount
    }))
  },

  async getRecentTransactions (
    offset: number = 0,
    limit: number = 5
  ): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, wallet:wallets(id, name, currency)')
      .eq('is_deleted', false)
      .order('date', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  },

  async restore (id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .update({ is_deleted: false })
      .eq('id', id)

    if (error) throw error
  },

  async hideTransaction (id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .update({ is_hidden: true })
      .eq('id', id)
    if (error) throw error
  },

  async getMonthlyExpensesByCategory (
    walletId: string,
    year: number,
    month: number
  ): Promise<{ category_id: string; amount: number }[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get first and last day of specified month
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    let query = supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .gte('date', firstDayOfMonth.toISOString())
      .lte('date', lastDayOfMonth.toISOString())

    // Add wallet filter if specified
    if (walletId && walletId !== 'all') {
      query = query.eq('wallet_id', walletId)
    }

    const { data, error } = await query

    if (error) throw error

    // Group by category_id and sum amounts
    const categoryTotals = (data || []).reduce((acc, transaction) => {
      const categoryId = transaction.category_id || 'uncategorized'
      acc[categoryId] = (acc[categoryId] || 0) + transaction.amount
      return acc
    }, {} as Record<string, number>)

    return Object.entries(categoryTotals).map(([category_id, amount]) => ({
      category_id,
      amount
    }))
  },

  async getCurrentMonthNetByCategory (
    walletId?: string
  ): Promise<{ category_id: string; amount: number }[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get first and last day of current month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    let query = supabase
      .from('transactions')
      .select('category_id, amount, type')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .gte('date', firstDayOfMonth.toISOString())
      .lte('date', lastDayOfMonth.toISOString())

    // Add wallet filter if specified
    if (walletId && walletId !== 'all') {
      query = query.eq('wallet_id', walletId)
    }

    const { data, error } = await query

    if (error) throw error

    // Group by category_id and calculate net (expenses - income)
    const categoryTotals = (data || []).reduce((acc, transaction) => {
      const categoryId = transaction.category_id || 'uncategorized'
      if (!acc[categoryId]) {
        acc[categoryId] = { expenses: 0, income: 0 }
      }

      if (transaction.type === 'expense') {
        acc[categoryId].expenses += transaction.amount
      } else if (transaction.type === 'income') {
        acc[categoryId].income += transaction.amount
      }

      return acc
    }, {} as Record<string, { expenses: number; income: number }>)

    // Calculate net amount (expenses - income) and only include categories with positive net
    return Object.entries(categoryTotals)
      .map(([category_id, totals]) => ({
        category_id,
        amount: totals.expenses - totals.income
      }))
      .filter(item => item.amount > 0) // Only show categories with net positive spending
  }
}
