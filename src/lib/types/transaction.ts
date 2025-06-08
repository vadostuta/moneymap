export type TransactionType = 'expense' | 'income'

export type TransactionCategory = string

export type TransactionLabel =
  | 'Personal'
  | 'Business'
  | 'Family'
  | 'Important'
  | 'Recurring'

export interface Transaction {
  id: string
  user_id: string
  wallet_id: string
  type: TransactionType
  amount: number
  description?: string
  category: TransactionCategory
  label: TransactionLabel
  date: string
  created_at: string
  updated_at: string
  wallet: {
    id: string
    name: string
    currency: string
  }
}

export type CreateTransactionDTO = Omit<
  Transaction,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'wallet'
> & {
  date?: string
}

export type UpdateTransactionDTO = Partial<CreateTransactionDTO>
