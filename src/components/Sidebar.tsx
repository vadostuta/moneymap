'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from 'react-i18next'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { QuickTransactionForm } from '@/components/transaction/QuickTransactionForm'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useState } from 'react'
import { LayoutDashboard, Receipt } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Sidebar () {
  const { user, signInWithGoogle, signOut } = useAuth()
  const pathname = usePathname()
  const [dialogOpen, setDialogOpen] = useState(false)
  const { t } = useTranslation('common')

  const navItems = [
    {
      href: '/overview',
      label: t('navigation.overview'),
      icon: LayoutDashboard
    },
    {
      href: '/transactions',
      label: t('navigation.transactions'),
      icon: Receipt
    }
  ]

  return (
    <aside className='hidden md:flex flex-col w-64 border-r bg-sidebar text-sidebar-foreground md:bg-sidebar'>
      <div className='p-6'>
        <Link
          href='/overview'
          className='font-bold text-xl hover:text-primary transition-colors'
        >
          MoneyMap
        </Link>
      </div>

      {user && (
        <>
          <div className='px-3 py-2'>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size='sm' className='w-full gap-2'>
                  <Plus className='h-4 w-4' />
                  {t('transactions.add')}
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                  <DialogTitle>{t('transactions.add')}</DialogTitle>
                </DialogHeader>
                <QuickTransactionForm
                  onSuccess={() => setDialogOpen(false)}
                  onCancel={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <nav className='flex-1 px-3 py-2'>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  pathname === item.href || pathname.startsWith(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className='h-4 w-4' />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className='p-4 border-t'>
            <div className='flex items-center gap-4 mb-4'>
              <LanguageSwitcher />
            </div>
            <div className='text-sm text-muted-foreground mb-2'>
              {user.email}
            </div>
            <Button variant='outline' onClick={signOut} className='w-full'>
              {t('auth.signOut')}
            </Button>
          </div>
        </>
      )}

      {!user && (
        <div className='p-4'>
          <Button onClick={signInWithGoogle} className='w-full'>
            {t('auth.signInWithGoogle')}
          </Button>
        </div>
      )}
    </aside>
  )
}
