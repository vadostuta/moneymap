'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { QuickTransactionForm } from '@/components/transaction/QuickTransactionForm'

export function Header () {
  const { user, signInWithGoogle, signOut } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <header className='border-b flex justify-center'>
      <div className='container flex h-16 items-center justify-between px-4'>
        <div className='flex items-center gap-4 md:gap-8'>
          <Link
            href='/overview'
            className='font-bold hover:text-primary transition-colors'
          >
            MoneyMap
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <nav className='hidden md:flex gap-4'>
              <Link
                href='/overview'
                className={`hover:text-primary transition-colors ${
                  pathname === '/overview'
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                Overview
              </Link>
              {/* <Link
                href='/dashboard'
                className={`hover:text-primary transition-colors ${
                  pathname === '/dashboard'
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                Dashboard
              </Link> */}
              <Link
                href='/transactions'
                className={`hover:text-primary transition-colors ${
                  pathname === '/transactions'
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                Transactions
              </Link>
              <Link
                href='/wallets'
                className={`hover:text-primary transition-colors ${
                  pathname === '/wallets'
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                Wallets
              </Link>
              <Link
                href='/settings'
                className={`hover:text-primary transition-colors ${
                  pathname.startsWith('/settings')
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                Settings
              </Link>
            </nav>
          )}
        </div>

        <div className='hidden md:flex items-center gap-4'>
          {/* Desktop Actions */}
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size='sm' className='gap-2'>
                  <Plus className='h-4 w-4' />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[600px]'>
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                </DialogHeader>
                <QuickTransactionForm
                  onSuccess={() => setDialogOpen(false)}
                  onCancel={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}

          {user ? (
            <div className='flex items-center gap-4'>
              <span className='hidden lg:inline'>{user.email}</span>
              <Button variant='outline' onClick={signOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Button onClick={signInWithGoogle}>Sign In with Google</Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className='md:hidden'>
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size='sm' className='gap-2'>
                  <Plus className='h-4 w-4' />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[600px]'>
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                </DialogHeader>
                <QuickTransactionForm
                  onSuccess={() => setDialogOpen(false)}
                  onCancel={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {user && (
          <button
            className='md:hidden p-2 mr-2'
            onClick={toggleMobileMenu}
            aria-label='Toggle menu'
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className='md:hidden fixed top-16 left-0 right-0 bg-background border-b z-50'>
          <nav className='flex flex-col p-4 px-6'>
            <Link
              href='/overview'
              className={`py-2 hover:text-primary transition-colors ${
                pathname === '/overview'
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Overview
            </Link>
            <Link
              href='/transactions'
              className={`py-2 hover:text-primary transition-colors ${
                pathname === '/transactions'
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Transactions
            </Link>
            <Link
              href='/wallets'
              className={`py-2 hover:text-primary transition-colors ${
                pathname === '/wallets'
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Wallets
            </Link>
            <Link
              href='/settings'
              className={`py-2 hover:text-primary transition-colors ${
                pathname.startsWith('/settings')
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Settings
            </Link>
            <div className='pt-4 border-t mt-2'>
              <div className='text-sm text-muted-foreground mb-2'>
                {user.email}
              </div>
              <Button variant='outline' onClick={signOut} className='w-full'>
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      )}

      {/* Mobile Sign In (when not logged in) */}
      {!user && (
        <div className='md:hidden px-4'>
          <Button onClick={signInWithGoogle} size='sm'>
            Sign In
          </Button>
        </div>
      )}
    </header>
  )
}
