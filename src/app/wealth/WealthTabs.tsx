'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/wealth', label: 'wealth.tabs.history' },
  { href: '/wealth/distribution', label: 'wealth.tabs.distribution' },
  { href: '/wealth/goals', label: 'wealth.tabs.goals' }
]

export function WealthTabs () {
  const { t } = useTranslation('common')
  const pathname = usePathname()

  return (
    <nav className='inline-flex rounded-lg bg-muted p-1 text-sm'>
      {TABS.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={pathname === tab.href ? 'page' : undefined}
          className={cn(
            'rounded-md px-3 py-1.5 font-medium transition-colors',
            pathname === tab.href
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t(tab.label)}
        </Link>
      ))}
    </nav>
  )
}
