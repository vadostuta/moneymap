'use client'

import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from 'react-i18next'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogIn, LogOut, Plus, Menu, X } from 'lucide-react'
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
import {
  LayoutDashboard,
  Wallet,
  Settings,
  Receipt,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

export function AppSidebar () {
  const { user, signInWithGoogle, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useTranslation('common')
  const { state: collapsed, toggleSidebar } = useSidebar()

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
      href: '/analytics',
      label: t('navigation.analytics'),
      icon: BarChart3
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (window.innerWidth >= 768) {
        if (event.ctrlKey || event.metaKey) {
          if (event.key === 's') {
            event.preventDefault()
            toggleSidebar()
          } else if (event.key === 'd') {
            event.preventDefault()
            setDialogOpen(true)
          } else if (event.key >= '1' && event.key <= '5') {
            event.preventDefault()
            const index = parseInt(event.key) - 1
            if (index >= 0 && index < navItems.length) {
              router.push(navItems[index].href)
            }
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar, navItems, router])

  return (
    <>
      {/* Mobile Menu Button */}
      <div className='md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b'>
        <div className='flex items-center justify-between p-4'>
          <button
            className='flex items-center gap-2 text-foreground hover:bg-accent/50 transition-colors'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={t('common.menu')}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            <span className='font-medium'>Menu</span>
          </button>

          <Link
            href='/overview'
            className='text-foreground hover:text-primary transition-colors'
          >
            <svg
              width='24'
              height='24'
              viewBox='0 0 200 200'
              xmlns='http://www.w3.org/2000/svg'
              className='text-foreground'
            >
              {/* Pie Chart Segments */}
              <circle cx='100' cy='100' r='70' fill='currentColor' />
              <path
                d='M100,30 A70,70 0 0,1 170,100 L140,100 A40,40 0 0,0 100,60 Z'
                fill='#57C6E1'
              />
              <path
                d='M170,100 A70,70 0 0,1 100,170 L100,140 A40,40 0 0,0 140,100 Z'
                fill='#4DA3FF'
              />
              <path
                d='M100,170 A70,70 0 0,1 30,100 L60,100 A40,40 0 0,0 100,140 Z'
                fill='#FF6B6B'
              />
              <path
                d='M30,100 A70,70 0 0,1 100,30 L100,60 A40,40 0 0,0 60,100 Z'
                fill='#FFD93D'
              />
              {/* Inner Circle (White Center) */}
              <circle cx='100' cy='100' r='40' fill='#fff' />
            </svg>
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className='md:hidden fixed inset-0 bg-background z-40 pt-16'>
          <div className='p-4'>
            {user && (
              <div className='mb-4'>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button size='sm' className='w-full gap-2'>
                            <Plus className='h-4 w-4' />
                            {t('transactions.add')}
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('transactions.add')}</p>
                        <p className='text-xs text-muted-foreground'>
                          {t('sidebar.hotkey.add-transaction', 'Ctrl + D')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
            )}

            <nav className='flex flex-col gap-2'>
              {navItems.map((item, index) => (
                <TooltipProvider key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2 p-2 rounded-md ${
                          pathname === item.href ||
                          pathname.startsWith(item.href)
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className='h-4 w-4' />
                        {item.label}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.label}</p>
                      <p className='text-xs text-muted-foreground'>
                        {t('sidebar.hotkey.nav-route', 'Ctrl + {{number}}', {
                          number: index + 1
                        })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </nav>

            <div className='mt-4 pt-4 border-t'>
              <div className='flex items-center gap-4 mb-4'>
                <LanguageSwitcher />
                <ThemeToggle />
              </div>

              {user ? (
                <>
                  <div className='text-sm text-muted-foreground mb-2'>
                    {user.email}
                  </div>
                  <Button
                    variant='outline'
                    onClick={signOut}
                    className='w-full'
                  >
                    {t('auth.signOut')}
                  </Button>
                </>
              ) : (
                <Button onClick={signInWithGoogle} className='w-full'>
                  {t('auth.signInWithGoogle')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className='hidden md:block'>
        <Sidebar
          collapsible='icon'
          className='bg-sidebar text-sidebar-foreground'
        >
          <SidebarHeader
            className={`p-6 ${
              collapsed === 'collapsed' ? 'px-2 pb-3' : 'pb-2 px-4'
            }`}
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
                {collapsed === 'expanded' ? (
                  <div className='flex flex-col items-center'>
                    <svg
                      width='40'
                      height='40'
                      viewBox='0 0 200 200'
                      xmlns='http://www.w3.org/2000/svg'
                      className='text-sidebar-foreground'
                    >
                      {/* Pie Chart Segments */}
                      <circle cx='100' cy='100' r='70' fill='currentColor' />
                      <path
                        d='M100,30 A70,70 0 0,1 170,100 L140,100 A40,40 0 0,0 100,60 Z'
                        fill='#57C6E1'
                      />
                      <path
                        d='M170,100 A70,70 0 0,1 100,170 L100,140 A40,40 0 0,0 140,100 Z'
                        fill='#4DA3FF'
                      />
                      <path
                        d='M100,170 A70,70 0 0,1 30,100 L60,100 A40,40 0 0,0 100,140 Z'
                        fill='#FF6B6B'
                      />
                      <path
                        d='M30,100 A70,70 0 0,1 100,30 L100,60 A40,40 0 0,0 60,100 Z'
                        fill='#FFD93D'
                      />
                      {/* Inner Circle (White Center) */}
                      <circle cx='100' cy='100' r='40' fill='#fff' />
                    </svg>
                    <span>MoneyMap</span>
                  </div>
                ) : (
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 200 200'
                    xmlns='http://www.w3.org/2000/svg'
                    className='text-sidebar-foreground'
                  >
                    {/* Pie Chart Segments */}
                    <circle cx='100' cy='100' r='70' fill='currentColor' />
                    <path
                      d='M100,30 A70,70 0 0,1 170,100 L140,100 A40,40 0 0,0 100,60 Z'
                      fill='#57C6E1'
                    />
                    <path
                      d='M170,100 A70,70 0 0,1 100,170 L100,140 A40,40 0 0,0 140,100 Z'
                      fill='#4DA3FF'
                    />
                    <path
                      d='M100,170 A70,70 0 0,1 30,100 L60,100 A40,40 0 0,0 100,140 Z'
                      fill='#FF6B6B'
                    />
                    <path
                      d='M30,100 A70,70 0 0,1 100,30 L100,60 A40,40 0 0,0 60,100 Z'
                      fill='#FFD93D'
                    />
                    {/* Inner Circle (White Center) */}
                    <circle cx='100' cy='100' r='40' fill='#fff' />
                  </svg>
                )}
              </Link>
              <ThemeToggle />
            </div>
          </SidebarHeader>

          <SidebarContent className='text-sidebar-foreground'>
            {user && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <div
                    className={`py-2 ${
                      collapsed === 'collapsed' ? 'mb-4' : ''
                    }`}
                  >
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                              <Button
                                size='sm'
                                className='w-full gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                              >
                                <Plus className='h-4 w-4' />
                                {collapsed === 'expanded' &&
                                  t('transactions.add')}
                              </Button>
                            </DialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('transactions.add')}</p>
                            <p className='text-xs text-muted-foreground'>
                              {t('sidebar.hotkey.add-transaction', 'Ctrl + D')}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                    {navItems.map((item, index) => (
                      <SidebarMenuItem key={item.href}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  pathname === item.href ||
                                  pathname.startsWith(item.href)
                                }
                                className='text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                              >
                                <Link
                                  href={item.href}
                                  className='text-sidebar-foreground'
                                >
                                  <item.icon className='h-4 w-4' />
                                  {collapsed === 'expanded' && (
                                    <span>{item.label}</span>
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{item.label}</p>
                              <p className='text-xs text-muted-foreground'>
                                {t(
                                  'sidebar.hotkey.nav-route',
                                  'Ctrl + {{number}}',
                                  {
                                    number: index + 1
                                  }
                                )}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                    {t('auth.signOut')}
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
      </div>
    </>
  )
}
