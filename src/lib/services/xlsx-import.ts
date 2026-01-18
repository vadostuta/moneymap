import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase/client'
import { CreateTransactionDTO } from '@/lib/types/transaction'
import { Category } from '@/lib/types/category'
import { mapMonobankCategory, isTransferCategory } from './xlsx-category-mapper'

export interface ParsedXlsxRow {
  date: string
  category: string
  card: string
  description: string
  amount: number
  cardCurrency: string
}

export const xlsxImportService = {
  /**
   * Parses an XLSX file and returns structured transaction data
   * @param file - The uploaded XLSX file
   * @returns Array of parsed rows
   */
  async parseXlsxFile (file: File): Promise<ParsedXlsxRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = e => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]

          // Convert to JSON, starting from row 2 (row 1 is merged title)
          // Use row 2 as headers but provide our own mapping
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
            firstSheet,
            {
              range: 1, // Start from row 2 (0-indexed, so 1 means row 2)
              header: [
                'date',
                'category',
                'card',
                'description',
                'amount',
                'cardCurrency',
                'amountInTxCurrency',
                'txCurrency',
                'restAtEnd',
                'restCurrency'
              ]
            }
          )

          // Skip the first row which contains header names
          const dataRows = jsonData.slice(1)

          // Parse and filter valid rows
          const rows: ParsedXlsxRow[] = dataRows
            .filter(row => row.date && row.amount !== undefined)
            .map(row => ({
              date: String(row.date || ''),
              category: String(row.category || ''),
              card: String(row.card || ''),
              description: String(row.description || ''),
              amount: parseFloat(String(row.amount)) || 0,
              cardCurrency: String(row.cardCurrency || 'UAH')
            }))

          resolve(rows)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file)
    })
  },

  /**
   * Transforms parsed XLSX rows into CreateTransactionDTO objects
   * @param rows - Parsed XLSX rows
   * @param walletId - Target wallet ID
   * @param categories - Available system categories
   * @returns Array of transaction DTOs ready for insertion
   */
  transformToTransactions (
    rows: ParsedXlsxRow[],
    walletId: string,
    categories: Category[]
  ): CreateTransactionDTO[] {
    return rows
      .filter(row => row.amount !== 0 && row.date)
      .map(row => {
        // Parse date from "DD.MM.YYYY HH:MM:SS" format
        const [datePart, timePart] = row.date.split(' ')
        const [day, month, year] = datePart.split('.')
        const isoDate = new Date(
          `${year}-${month}-${day}T${timePart || '00:00:00'}`
        ).toISOString()

        // Determine transaction type
        const isTransfer = isTransferCategory(row.category)
        let type: 'expense' | 'income' | 'transfer'

        if (isTransfer) {
          type = 'transfer'
        } else if (row.amount < 0) {
          type = 'expense'
        } else {
          type = 'income'
        }

        return {
          type,
          amount: Math.abs(row.amount),
          wallet_id: walletId,
          category_id: mapMonobankCategory(row.category, categories),
          label: 'Personal' as const,
          date: isoDate,
          description: row.description || undefined
        }
      })
  },

  /**
   * Imports transactions into the database via bulk insert
   * @param transactions - Array of transactions to insert
   * @returns Result with success and failed counts
   */
  async importTransactions (
    transactions: CreateTransactionDTO[]
  ): Promise<{ success: number; failed: number }> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be logged in')

    // Add user_id to each transaction
    const transactionsWithUser = transactions.map(t => ({
      ...t,
      user_id: user.id,
      source: 'xlsx_import'
    }))

    // Bulk insert (following monobank.ts pattern)
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionsWithUser)
      .select()

    if (error) throw error

    return {
      success: data?.length || 0,
      failed: transactions.length - (data?.length || 0)
    }
  }
}
