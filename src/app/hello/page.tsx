import { QuickTransactionForm } from '@/components/transaction/QuickTransactionForm'
import { RecentTransactions } from '@/components/transaction/RecentTransactions'
import { ExpensePieChart } from '@/components/ui/ExpensePieChart'

export default function Hello () {
  return (
    <div className='container px-4 py-4 sm:py-6 mx-auto max-w-7xl'>
      <div className='grid grid-cols-12 gap-6'>
        <div className='col-span-12 lg:col-span-5'>
          <ExpensePieChart />

          <QuickTransactionForm />
        </div>

        <div className='col-span-12 lg:col-span-7'>
          <RecentTransactions />
        </div>
      </div>
    </div>
  )
}
