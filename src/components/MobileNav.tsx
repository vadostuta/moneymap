'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { Menu, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { QuickTransactionForm } from '@/components/transaction/QuickTransactionForm'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './Sidebar'

export function MobileNav () {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const { t } = useTranslation('common')

  return (
    <div className='md:hidden border-b'>
      <div className='container flex h-16 items-center justify-between px-4'>
        <Link
          href='/overview'
          className='font-bold hover:text-primary transition-colors'
        >
          MoneyMap
        </Link>

        <div className='flex items-center gap-2'>
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size='sm' className='gap-2'>
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
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon'>
                <Menu className='h-5 w-5' />
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='p-0'>
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}
