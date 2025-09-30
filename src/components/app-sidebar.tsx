'use client'

import { useAuth } from '@/contexts/auth-context'
import { useWallet, ALL_WALLETS } from '@/contexts/wallet-context'
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
  BarChart3,
  PieChart,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Eye, EyeOff } from 'lucide-react'
import { usePrivacy } from '@/contexts/privacy-context'

export function AppSidebar () {
  const { user, signInWithGoogle, signOut } = useAuth()
  const {
    selectedWallet,
    setSelectedWallet,
    wallets,
    isLoading: walletsLoading
  } = useWallet()
  const pathname = usePathname()
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useTranslation('common')
  const { state: collapsed, toggleSidebar } = useSidebar()
  const { isHidden, toggleHidden } = usePrivacy()

  const handleWalletChange = (walletId: string) => {
    if (walletId === 'all') {
      setSelectedWallet(ALL_WALLETS)
    } else {
      const wallet = wallets.find(w => w.id === walletId)
      if (wallet) {
        setSelectedWallet(wallet)
      }
    }
  }

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
      icon: BarChart3,
      subItems: [
        {
          href: '/analytics',
          label: t('navigation.analyticsOverview'),
          icon: BarChart3
        },
        {
          href: '/analytics/category',
          label: t('navigation.analyticsTrend'),
          icon: PieChart
        }
      ]
    },
    {
      href: '/report',
      label: t('navigation.report', 'Report'),
      icon: FileText
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
        // Use metaKey (Cmd) for macOS, or ctrlKey for other platforms
        if (event.metaKey || event.ctrlKey) {
          if (event.key === 's') {
            event.preventDefault()
            toggleSidebar()
          } else if (event.key === 'd') {
            event.preventDefault()
            setDialogOpen(true)
          } else if (event.key >= '1' && event.key <= '7') {
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
                {/* Wallet Selector */}
                {!walletsLoading && wallets.length > 0 && (
                  <div className='mb-4'>
                    <div className='text-xs font-medium text-muted-foreground mb-2'>
                      {t('wallets.activeWallet')}
                    </div>
                    <Select
                      value={selectedWallet?.id || ''}
                      onValueChange={handleWalletChange}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder={t('wallets.selectWallet')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>
                          {t('wallets.allWallets')}
                        </SelectItem>
                        {wallets.map(wallet => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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
                          {t('sidebar.hotkey.add-transaction', 'Cmd + D')}
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
                        {t('sidebar.hotkey.nav-route', 'Cmd + {{number}}', {
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
                {/* Add Privacy Toggle */}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={toggleHidden}
                  className='flex items-center gap-2'
                >
                  {isHidden ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                  <span className='hidden sm:inline'>
                    {isHidden ? t('privacy.show') : t('privacy.hide')}
                  </span>
                </Button>
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
              <div className='flex items-center gap-2'>
                <ThemeToggle />
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className='text-sidebar-foreground'>
            {user && (
              <SidebarGroup>
                <SidebarGroupContent>
                  {/* Wallet Selector */}
                  {!walletsLoading && wallets.length > 0 && (
                    <div
                      className={`${
                        collapsed === 'collapsed'
                          ? 'flex justify-center px-0 mb-4'
                          : 'px-3 py-2'
                      }`}
                    >
                      {collapsed === 'expanded' && (
                        <div className='text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2'>
                          <Wallet className='h-3 w-3' />
                          {t('wallets.activeWallet')}
                        </div>
                      )}
                      <Select
                        value={selectedWallet?.id || ''}
                        onValueChange={handleWalletChange}
                      >
                        <SelectTrigger
                          className={`${
                            collapsed === 'collapsed'
                              ? 'h-8 w-8 p-0 flex items-center justify-center rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors [&>svg]:hidden'
                              : 'w-full'
                          }`}
                        >
                          {collapsed === 'collapsed' ? (
                            <div className='flex items-center justify-center'>
                              <Wallet className='h-4 w-4 text-sidebar-foreground' />
                            </div>
                          ) : (
                            <SelectValue
                              placeholder={t('wallets.selectWallet')}
                            />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>
                            {t('wallets.allWallets')}
                          </SelectItem>
                          {wallets.map(wallet => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                              {wallet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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
                              {t('sidebar.hotkey.add-transaction', 'Cmd + D')}
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
                        {item.subItems ? (
                          // Analytics with sub-items
                          collapsed === 'collapsed' ? (
                            // In collapsed state, show sub-items as individual centered items
                            <div className='space-y-1'>
                              {item.subItems.map(subItem => (
                                <TooltipProvider key={subItem.href}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <SidebarMenuButton
                                        asChild
                                        isActive={
                                          pathname === subItem.href ||
                                          pathname.startsWith(subItem.href)
                                        }
                                        className='text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex justify-center'
                                      >
                                        <Link
                                          href={subItem.href}
                                          className='text-sidebar-foreground flex justify-center'
                                        >
                                          <subItem.icon className='h-4 w-4' />
                                        </Link>
                                      </SidebarMenuButton>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{subItem.label}</p>
                                      <p className='text-xs text-muted-foreground'>
                                        {t(
                                          'sidebar.hotkey.nav-route',
                                          'Cmd + {{number}}',
                                          {
                                            number: index + 1
                                          }
                                        )}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                            </div>
                          ) : (
                            // In expanded state, show with parent label
                            <div className='space-y-1'>
                              <div className='px-3 py-2 text-xs font-medium text-muted-foreground'>
                                {item.label}
                              </div>
                              {item.subItems.map(subItem => (
                                <TooltipProvider key={subItem.href}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <SidebarMenuButton
                                        asChild
                                        isActive={
                                          pathname === subItem.href ||
                                          pathname.startsWith(subItem.href)
                                        }
                                        className='text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ml-3'
                                      >
                                        <Link
                                          href={subItem.href}
                                          className='text-sidebar-foreground'
                                        >
                                          <subItem.icon className='h-4 w-4' />
                                          <span>{subItem.label}</span>
                                        </Link>
                                      </SidebarMenuButton>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{subItem.label}</p>
                                      <p className='text-xs text-muted-foreground'>
                                        {t(
                                          'sidebar.hotkey.nav-route',
                                          'Cmd + {{number}}',
                                          {
                                            number: index + 1
                                          }
                                        )}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                            </div>
                          )
                        ) : (
                          // Regular navigation item
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
                                    'Cmd + {{number}}',
                                    {
                                      number: index + 1
                                    }
                                  )}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
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
                {/* Privacy Toggle - First Row */}
                {collapsed === 'expanded' && (
                  <div className='mb-4'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={toggleHidden}
                      className='w-full flex items-center justify-center gap-2'
                    >
                      {isHidden ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                      <span className='text-xs'>
                        {isHidden ? t('privacy.show') : t('privacy.hide')}
                      </span>
                    </Button>
                  </div>
                )}

                {/* Language Switcher - Second Row */}
                {collapsed === 'expanded' && (
                  <div className='mb-4'>
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
