import { format } from 'date-fns'
import { Transaction, TransactionCategory } from '@/lib/types/transaction'
import {
  ArrowDown,
  ArrowUp,
  Utensils,
  ShoppingBag,
  Car,
  Receipt,
  Film,
  Heart,
  GraduationCap,
  Plane,
  Gift,
  HelpCircle,
  CreditCard,
  HandHeart,
  ChevronDown,
  Trash2,
  Wallet
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionService } from '@/lib/services/transaction'
import { toastService } from '@/lib/services/toast'
import { Button } from '@/components/ui/button'

export function RecentTransactionItem ({
  transaction
}: {
  transaction: Transaction
}) {
  const queryClient = useQueryClient()

  const updateCategoryMutation = useMutation({
    mutationFn: async (newCategory: TransactionCategory) => {
      await transactionService.update(transaction.id, {
        category: newCategory
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] })
      toastService.success('Category updated successfully')
    },
    onError: () => {
      toastService.error('Failed to update category')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await transactionService.delete(transaction.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] })
      toastService.success('Transaction deleted successfully')
    },
    onError: () => {
      toastService.error('Failed to delete transaction')
    }
  })

  const getCategoryColor = (category: TransactionCategory) => {
    const colors: Record<TransactionCategory, { bg: string; text: string }> = {
      'Food & Dining': { bg: 'bg-orange-500/10', text: 'text-orange-500' },
      Shopping: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
      Transportation: { bg: 'bg-green-500/10', text: 'text-green-500' },
      'Bills & Utilities': { bg: 'bg-purple-500/10', text: 'text-purple-500' },
      Entertainment: { bg: 'bg-pink-500/10', text: 'text-pink-500' },
      Healthcare: { bg: 'bg-red-500/10', text: 'text-red-500' },
      Education: { bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
      Travel: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
      Presents: { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
      Other: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
      Donations: { bg: 'bg-teal-500/10', text: 'text-teal-500' },
      Subscriptions: { bg: 'bg-violet-500/10', text: 'text-violet-500' }
    }

    return colors[category] || colors['Other']
  }

  const getCategoryIcon = (category: TransactionCategory) => {
    const icons: Record<TransactionCategory, React.ReactNode> = {
      'Food & Dining': <Utensils className='w-3 h-3' />,
      Shopping: <ShoppingBag className='w-3 h-3' />,
      Transportation: <Car className='w-3 h-3' />,
      'Bills & Utilities': <Receipt className='w-3 h-3' />,
      Entertainment: <Film className='w-3 h-3' />,
      Healthcare: <Heart className='w-3 h-3' />,
      Education: <GraduationCap className='w-3 h-3' />,
      Travel: <Plane className='w-3 h-3' />,
      Presents: <Gift className='w-3 h-3' />,
      Other: <HelpCircle className='w-3 h-3' />,
      Donations: <HandHeart className='w-3 h-3' />,
      Subscriptions: <CreditCard className='w-3 h-3' />
    }

    return icons[category] || icons['Other']
  }

  const categoryColors = getCategoryColor(transaction.category)
  const categoryIcon = getCategoryIcon(transaction.category)

  const handleCategoryChange = (newCategory: TransactionCategory) => {
    updateCategoryMutation.mutate(newCategory)
  }

  const categories: TransactionCategory[] = [
    'Food & Dining',
    'Shopping',
    'Transportation',
    'Bills & Utilities',
    'Entertainment',
    'Healthcare',
    'Education',
    'Travel',
    'Presents',
    'Other',
    'Donations',
    'Subscriptions'
  ]

  return (
    <div className='flex flex-col sm:flex-row sm:items-start justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/5 transition-colors gap-3'>
      <div className='flex flex-col gap-2'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
          <span className='text-base sm:text-lg font-semibold truncate'>
            {transaction.description}
          </span>
          <span className='text-xs sm:text-sm text-muted-foreground flex items-center gap-1'>
            <Wallet className='w-3 h-3 sm:w-4 sm:h-4' />
            {transaction.wallet?.name}
          </span>
        </div>

        <div className='flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text} hover:opacity-80 transition-opacity`}
              >
                {categoryIcon}
                <span className='hidden sm:inline'>{transaction.category}</span>
                <span className='sm:hidden'>
                  {transaction.category.split(' ')[0]}
                </span>
                <ChevronDown className='w-3 h-3 ml-1' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-48'>
              {categories.map(category => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className='flex items-center gap-2'
                >
                  {getCategoryIcon(category)}
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className='hidden sm:inline'>•</span>
          <div className='flex items-center gap-1'>
            <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      <div className='flex items-center justify-between sm:justify-end gap-2'>
        <div
          className={`flex items-center gap-1 text-base sm:text-lg font-semibold ${
            transaction.type === 'expense' ? 'text-white' : 'text-emerald-500'
          }`}
        >
          {transaction.type === 'expense' ? (
            <ArrowDown className='w-4 h-4 sm:w-5 sm:h-5' />
          ) : (
            <ArrowUp className='w-4 h-4 sm:w-5 sm:h-5' />
          )}
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: transaction.wallet?.currency || 'USD'
          }).format(transaction.amount)}
        </div>
        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive'
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
        </Button>
      </div>
    </div>
  )
}
