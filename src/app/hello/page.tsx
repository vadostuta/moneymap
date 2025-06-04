import { RecentTransactions } from '@/components/transaction/RecentTransactions'
import { ExpensePieChart } from '@/components/ui/ExpensePieChart'

export default function Hello () {
  return (
    <div className='container px-4 py-4 sm:py-6 mx-auto max-w-7xl'>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-1'>
          <ExpensePieChart />
        </div>

        <div className='lg:col-span-2'>
          <RecentTransactions />
        </div>
      </div>
    </div>
  )
}
