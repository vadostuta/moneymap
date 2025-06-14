import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/header'
import { AuthProvider } from '@/contexts/auth-context'
import ClientToaster from '@/components/ClientToaster'
import { MonobankSyncProvider } from '@/components/providers/MonobankSyncProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { AuthGuard } from '@/components/AuthGuard'
import { LanguageProvider } from '@/contexts/language-context'
import { I18nProvider } from '@/components/I18nProvider'
import { I18nHydrate } from '@/components/I18nHydrate'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'MoneyMap',
  description: 'Track your finances'
}

export default function RootLayout ({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <I18nHydrate>
            <LanguageProvider>
              <QueryProvider>
                <AuthProvider>
                  <MonobankSyncProvider>
                    <div className='flex flex-col h-screen mx-auto max-w-7xl'>
                      <Header />
                      <main className='flex-1 flex justify-center'>
                        <div className='w-full'>
                          <AuthGuard>{children}</AuthGuard>
                        </div>
                      </main>
                    </div>
                  </MonobankSyncProvider>
                </AuthProvider>
              </QueryProvider>
            </LanguageProvider>
          </I18nHydrate>
        </I18nProvider>
        <ClientToaster />
      </body>
    </html>
  )
}
