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
  HandHeart
} from 'lucide-react'

export function RecentTransactionItem ({
  transaction
}: {
  transaction: Transaction
}) {
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

  return (
    <div className='flex items-start justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors'>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2'>
          <span className='text-lg font-semibold'>
            {transaction.description}
          </span>
          <span className='text-sm text-muted-foreground'>
            ({transaction.wallet?.name})
          </span>
        </div>

        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text}`}
          >
            {categoryIcon}
            {transaction.category}
          </div>
          <span>•</span>
          <div className='flex items-center gap-1'>
            <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      <div
        className={`flex items-center gap-1 text-lg font-semibold ${
          transaction.type === 'expense' ? 'text-white' : 'text-emerald-500'
        }`}
      >
        {transaction.type === 'expense' ? (
          <ArrowDown className='w-5 h-5' />
        ) : (
          <ArrowUp className='w-5 h-5' />
        )}
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: transaction.wallet?.currency || 'USD'
        }).format(transaction.amount)}
      </div>
    </div>
  )
}
