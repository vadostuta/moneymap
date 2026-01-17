'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { walletService } from '@/lib/services/wallet'
import { categoryService } from '@/lib/services/category'
import { xlsxImportService, ParsedXlsxRow } from '@/lib/services/xlsx-import'
import {
  mapMonobankCategory,
  isTransferCategory
} from '@/lib/services/xlsx-category-mapper'
import { toastService } from '@/lib/services/toast'
import { useTranslation } from 'react-i18next'
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  X
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface XlsxImportFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface PreviewTransaction {
  id: number
  date: string
  description: string
  amount: number
  type: 'expense' | 'income' | 'transfer'
  categoryId: string
  originalCategory: string
}

export function XlsxImportForm ({ onSuccess, onCancel }: XlsxImportFormProps) {
  const { t } = useTranslation('common')
  const queryClient = useQueryClient()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedWalletId, setSelectedWalletId] = useState<string>('')
  const [parsedRows, setParsedRows] = useState<ParsedXlsxRow[]>([])
  const [previewTransactions, setPreviewTransactions] = useState<
    PreviewTransaction[]
  >([])
  const [isParsing, setIsParsing] = useState(false)
  const [openCategoryId, setOpenCategoryId] = useState<number | null>(null)

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: walletService.getAll
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories
  })

  const activeCategories = useMemo(
    () => categories.filter(c => c.is_active),
    [categories]
  )

  // Set default wallet when wallets load
  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      const defaultWallet = wallets.find(w => w.is_primary) || wallets[0]
      if (defaultWallet) {
        setSelectedWalletId(defaultWallet.id)
      }
    }
  }, [wallets, selectedWalletId])

  // Transform parsed rows to preview transactions when rows or categories change
  useEffect(() => {
    if (parsedRows.length > 0 && categories.length > 0) {
      const previews: PreviewTransaction[] = parsedRows
        .filter(row => row.amount !== 0 && row.date)
        .map((row, index) => {
          // Parse date
          const [datePart, timePart] = row.date.split(' ')
          const [day, month, year] = datePart.split('.')
          const isoDate = new Date(
            `${year}-${month}-${day}T${timePart || '00:00:00'}`
          ).toISOString()

          // Determine type
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
            id: index,
            date: isoDate,
            description: row.description || row.category,
            amount: Math.abs(row.amount),
            type,
            categoryId: mapMonobankCategory(row.category, categories),
            originalCategory: row.category
          }
        })

      setPreviewTransactions(previews)
    }
  }, [parsedRows, categories])

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWalletId || previewTransactions.length === 0) {
        throw new Error('Please select a file and wallet')
      }

      // Use the preview transactions with user-modified categories
      const transactions = previewTransactions.map(preview => ({
        type: preview.type,
        amount: preview.amount,
        wallet_id: selectedWalletId,
        category_id: preview.categoryId,
        label: 'Personal' as const,
        date: preview.date,
        description: preview.description || undefined
      }))

      return xlsxImportService.importTransactions(transactions)
    },
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transactions-by-category'] })
      queryClient.invalidateQueries({ queryKey: ['list-transactions'] })

      toastService.success(
        t('xlsxImport.importSuccess', { count: result.success })
      )
      onSuccess?.()
    },
    onError: error => {
      toastService.error(t('xlsxImport.importError'))
      console.error('Import error:', error)
    }
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setIsParsing(true)
    setParsedRows([])
    setPreviewTransactions([])

    try {
      const rows = await xlsxImportService.parseXlsxFile(file)
      setParsedRows(rows)
    } catch (error) {
      toastService.error(t('xlsxImport.parseError'))
      console.error('Parse error:', error)
      setSelectedFile(null)
    } finally {
      setIsParsing(false)
    }
  }

  const handleCategoryChange = (transactionId: number, categoryId: string) => {
    setPreviewTransactions(prev =>
      prev.map(t => (t.id === transactionId ? { ...t, categoryId } : t))
    )
    setOpenCategoryId(null)
  }

  const handleRemoveTransaction = (transactionId: number) => {
    setPreviewTransactions(prev => prev.filter(t => t.id !== transactionId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    importMutation.mutate()
  }

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  const formatAmount = (amount: number, type: string) => {
    const formatted = amount.toLocaleString('uk-UA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
    if (type === 'expense') return `-${formatted}`
    if (type === 'income') return `+${formatted}`
    return formatted
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return <ArrowDownCircle className='h-3 w-3 text-red-500 flex-shrink-0' />
      case 'income':
        return <ArrowUpCircle className='h-3 w-3 text-green-500 flex-shrink-0' />
      case 'transfer':
        return <ArrowLeftRight className='h-3 w-3 text-blue-500 flex-shrink-0' />
      default:
        return null
    }
  }

  const getCategoryById = (id: string) => {
    return categories.find(c => c.id === id)
  }

  // Show create wallet prompt if no wallets exist
  if (wallets.length === 0) {
    return (
      <Card className='mx-auto'>
        <CardContent className='pt-6 px-4 text-center'>
          <p className='text-lg mb-4'>{t('wallets.createFirstWallet')}</p>
          <Link href='/wallets' onClick={onCancel}>
            <Button>{t('wallets.create')}</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='mx-auto border-0 shadow-none'>
      <form onSubmit={handleSubmit}>
        <CardContent className='space-y-4 pt-2 px-0'>
          {/* File Input */}
          <div className='space-y-2'>
            <Label htmlFor='xlsx-file'>{t('xlsxImport.selectFile')}</Label>
            <Input
              id='xlsx-file'
              type='file'
              accept='.xlsx,.xls'
              onChange={handleFileChange}
              className='cursor-pointer'
            />
            {selectedFile && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <FileSpreadsheet className='h-4 w-4' />
                <span className='truncate max-w-[200px]'>{selectedFile.name}</span>
                {isParsing && <Loader2 className='h-4 w-4 animate-spin' />}
                {previewTransactions.length > 0 && (
                  <span className='text-green-600'>
                    ({previewTransactions.length} {t('xlsxImport.rowsFound')})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Wallet Selector */}
          <div className='space-y-2'>
            <Label htmlFor='wallet'>{t('xlsxImport.selectWallet')}</Label>
            <Select
              value={selectedWalletId}
              onValueChange={setSelectedWalletId}
            >
              <SelectTrigger id='wallet' className='h-10'>
                <SelectValue placeholder={t('wallets.selectWallet')} />
              </SelectTrigger>
              <SelectContent>
                {wallets.map(wallet => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Preview */}
          {previewTransactions.length > 0 && (
            <div className='space-y-2'>
              <Label>{t('xlsxImport.preview')}</Label>
              <div className='h-[280px] rounded-md border overflow-y-auto overflow-x-hidden'>
                <div className='p-2 space-y-1'>
                  {previewTransactions.map(transaction => {
                    const category = getCategoryById(transaction.categoryId)
                    return (
                      <div
                        key={transaction.id}
                        className='flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors'
                        style={{ width: '35vw' }}
                      >
                        {/* Type Icon */}
                        <div className='w-4 flex-shrink-0'>
                          {getTypeIcon(transaction.type)}
                        </div>

                        {/* Date */}
                        <span className='text-xs text-muted-foreground w-12 flex-shrink-0'>
                          {formatDate(transaction.date)}
                        </span>

                        {/* Description with Tooltip */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className='text-xs truncate flex-1 min-w-0'>
                                {transaction.description}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side='top' className='max-w-[300px]'>
                              <p className='text-xs'>{transaction.description}</p>
                              <p className='text-xs text-muted-foreground'>
                                {transaction.originalCategory}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Amount */}
                        <span
                          className={cn(
                            'text-xs font-medium w-20 text-right flex-shrink-0',
                            transaction.type === 'expense' && 'text-red-500',
                            transaction.type === 'income' && 'text-green-500',
                            transaction.type === 'transfer' && 'text-blue-500'
                          )}
                        >
                          {formatAmount(transaction.amount, transaction.type)}
                        </span>

                        {/* Category Selector - Badge Style Popover */}
                        <Popover
                          open={openCategoryId === transaction.id}
                          onOpenChange={open =>
                            setOpenCategoryId(open ? transaction.id : null)
                          }
                          modal={true}
                        >
                          <PopoverTrigger asChild>
                            <button
                              type='button'
                              className='w-24 flex-shrink-0'
                            >
                              <Badge
                                variant='outline'
                                className='h-6 px-1.5 text-xs gap-1 cursor-pointer hover:bg-accent w-full justify-start'
                              >
                                {category?.icon && (
                                  <span className='text-xs'>{category.icon}</span>
                                )}
                                <span className='truncate'>
                                  {category?.name || 'Select'}
                                </span>
                              </Badge>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className='w-[280px] p-2 max-h-[300px] overflow-y-auto'
                            align='end'
                            side='top'
                            sideOffset={5}
                          >
                            <div className='grid grid-cols-2 gap-1'>
                              {activeCategories.map(cat => (
                                <button
                                  key={cat.id}
                                  type='button'
                                  onClick={() =>
                                    handleCategoryChange(transaction.id, cat.id)
                                  }
                                  className='transition-all duration-200 ease-in-out'
                                >
                                  <Badge
                                    variant={
                                      transaction.categoryId === cat.id
                                        ? 'default'
                                        : 'outline'
                                    }
                                    className={cn(
                                      'w-full justify-start gap-1 py-1.5 px-2 text-xs cursor-pointer',
                                      transaction.categoryId === cat.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-accent'
                                    )}
                                  >
                                    {cat.icon && (
                                      <span className='text-sm'>{cat.icon}</span>
                                    )}
                                    <span className='truncate'>{cat.name}</span>
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>

                        {/* Remove Button */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type='button'
                                onClick={() =>
                                  handleRemoveTransaction(transaction.id)
                                }
                                className='w-5 flex-shrink-0 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors'
                              >
                                <X className='h-3.5 w-3.5' />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side='top'>
                              <p className='text-xs'>{t('common.delete')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className='flex flex-wrap gap-2 text-sm'>
                <Badge variant='outline' className='gap-1 text-xs'>
                  <ArrowDownCircle className='h-3 w-3 text-red-500' />
                  {previewTransactions.filter(t => t.type === 'expense').length}{' '}
                  {t('transactions.expense').toLowerCase()}
                </Badge>
                <Badge variant='outline' className='gap-1 text-xs'>
                  <ArrowUpCircle className='h-3 w-3 text-green-500' />
                  {previewTransactions.filter(t => t.type === 'income').length}{' '}
                  {t('transactions.income').toLowerCase()}
                </Badge>
                <Badge variant='outline' className='gap-1 text-xs'>
                  <ArrowLeftRight className='h-3 w-3 text-blue-500' />
                  {previewTransactions.filter(t => t.type === 'transfer').length}{' '}
                  {t('transactions.transfers').toLowerCase()}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className='flex justify-end gap-2 px-0 pb-0'>
          {onCancel && (
            <Button type='button' variant='outline' onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
          <Button
            type='submit'
            disabled={
              importMutation.isPending ||
              isParsing ||
              previewTransactions.length === 0 ||
              !selectedWalletId
            }
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {t('xlsxImport.importing')}
              </>
            ) : (
              <>
                <Upload className='mr-2 h-4 w-4' />
                {t('xlsxImport.import')} ({previewTransactions.length})
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
