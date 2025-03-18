'use client'

import Link from 'next/link'

export default function SettingsLayout ({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className='container mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-6 text-foreground'>Settings</h1>
      <div className='flex gap-6'>
        <aside className='w-64 flex-shrink-0'>
          <nav className='space-y-1 bg-card rounded-lg p-4'>
            <Link
              href='/settings'
              className='block px-4 py-2 rounded-md text-foreground hover:bg-secondary transition-colors'
            >
              Bank Integrations
            </Link>
            {/* We can add more settings sections here later */}
          </nav>
        </aside>
        <main className='flex-1 max-w-3xl'>{children}</main>
      </div>
    </div>
  )
}
