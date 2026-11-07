'use client'

import { PageContainer, PageHeader } from '@/components/ui/page'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User, CreditCard, Tag } from 'lucide-react'

export default function SettingsLayout ({
  children
}: {
  children: React.ReactNode
}) {
  const { t } = useTranslation('common')
  const pathname = usePathname()

  const navItems = [
    {
      href: '/settings/account',
      label: t('settings.account.title'),
      icon: User
    },
    {
      href: '/settings/bank-integrations',
      label: t('settings.integrations.title'),
      icon: CreditCard
    },
    {
      href: '/settings/categories',
      label: t('settings.categories.title'),
      icon: Tag
    }
  ]

  return (
    <PageContainer style={{ minWidth: 'calc(100% - 5vw)' }} className='space-y-4 sm:space-y-6'>
      <PageHeader title={t('settings.title')} />

      <div className='flex flex-col md:flex-row gap-4 md:gap-6'>
        {/* Mobile Navigation */}
        <nav className='md:hidden space-y-1 bg-card rounded-lg p-3'>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm',
                'transition-colors duration-200',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary'
              )}
            >
              <item.icon className='h-4 w-4' />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Sidebar */}
        <aside className='hidden md:block w-64 flex-shrink-0'>
          <nav className='space-y-1 bg-card rounded-lg p-4'>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md',
                  'transition-colors duration-200',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                )}
              >
                <item.icon className='h-4 w-4' />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className='flex-1 max-w-3xl bg-card rounded-lg p-3 sm:p-4 md:p-6'>
          {children}
        </main>
      </div>
    </PageContainer>
  )
}
