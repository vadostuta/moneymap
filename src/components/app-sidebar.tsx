'use client'

import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from 'react-i18next'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogIn, LogOut, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { QuickTransactionForm } from '@/components/transaction/QuickTransactionForm'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useState, useEffect } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar
} from '@/components/ui/Sidebar'
import { LayoutDashboard, Wallet, Settings, Receipt } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export function AppSidebar () {
  const { user, signInWithGoogle, signOut } = useAuth()
  const pathname = usePathname()
  const [dialogOpen, setDialogOpen] = useState(false)
  const { t } = useTranslation('common')
  const { state: collapsed, toggleSidebar } = useSidebar()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault() // Prevent browser's save dialog
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

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
    },
    {
      href: '/wallets',
      label: t('navigation.wallets'),
      icon: Wallet
    },
    {
      href: '/settings',
      label: t('navigation.settings'),
      icon: Settings
    }
  ]

  return (
    <Sidebar collapsible='icon' className='bg-sidebar text-sidebar-foreground'>
      <SidebarHeader
        className={`p-6 ${collapsed === 'collapsed' ? 'px-2 pb-3' : ' px-4'}`}
      >
        <div
          className={`flex items-center justify-between ${
            collapsed === 'collapsed' ? 'flex-col gap-2' : ''
          }`}
        >
          <Link
            href='/overview'
            className={`font-bold ${
              collapsed === 'collapsed' ? 'text-base' : ''
            } text-sidebar-foreground hover:text-sidebar-primary transition-colors`}
          >
            {collapsed === 'expanded' ? 'MoneyMap' : 'MM'}
          </Link>
          <ThemeToggle />
        </div>
      </SidebarHeader>

      <SidebarContent className='text-sidebar-foreground'>
        {user && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div
                className={`py-2 ${collapsed === 'collapsed' ? 'mb-4' : ''}`}
              >
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size='sm'
                      className='w-full gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    >
                      <Plus className='h-4 w-4' />
                      {collapsed === 'expanded' && t('transactions.add')}
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

              <SidebarMenu>
                {navItems.map(item => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        pathname === item.href || pathname.startsWith(item.href)
                      }
                      className='text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    >
                      <Link
                        href={item.href}
                        className='text-sidebar-foreground'
                      >
                        <item.icon className='h-4 w-4' />
                        {collapsed === 'expanded' && <span>{item.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter
        className={`p-4 ${
          collapsed === 'expanded' ? 'px-4' : 'px-2'
        } border-t border-sidebar-border text-sidebar-foreground`}
      >
        {user ? (
          <>
            {collapsed === 'expanded' && (
              <div className='flex items-center gap-4 mb-4'>
                <LanguageSwitcher />
              </div>
            )}
            {collapsed === 'expanded' && (
              <div className='text-sm text-sidebar-foreground mb-2'>
                {user.email}
              </div>
            )}
            {collapsed === 'expanded' ? (
              <Button
                variant='outline'
                onClick={signOut}
                className='w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              >
                {collapsed === 'expanded' && t('auth.signOut')}
              </Button>
            ) : (
              <Button
                onClick={signOut}
                className='w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              >
                <LogOut className='h-4 w-4' />
              </Button>
            )}
          </>
        ) : collapsed === 'expanded' ? (
          <Button
            onClick={signInWithGoogle}
            className='w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          >
            {t('auth.signInWithGoogle')}
          </Button>
        ) : (
          <Button
            onClick={signInWithGoogle}
            className='w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          >
            <LogIn className='h-4 w-4' />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
