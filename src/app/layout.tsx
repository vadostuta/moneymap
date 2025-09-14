import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { WalletProvider } from '@/contexts/wallet-context'
import ClientToaster from '@/components/ClientToaster'
import { MonobankSyncProvider } from '@/components/providers/MonobankSyncProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { AuthGuard } from '@/components/AuthGuard'
import { LanguageProvider } from '@/contexts/language-context'
import { I18nProvider } from '@/components/I18nProvider'
import { I18nHydrate } from '@/components/I18nHydrate'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/Sidebar'
import { ThemeProvider } from '@/contexts/theme-context'
import { PrivacyProvider } from '@/contexts/privacy-context'

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
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme='system' storageKey='moneymap-theme'>
          <PrivacyProvider
            defaultHidden={false}
            storageKey='moneymap-privacy-hidden'
          >
            <I18nProvider>
              <I18nHydrate>
                <LanguageProvider>
                  <QueryProvider>
                    <AuthProvider>
                      <WalletProvider>
                        <MonobankSyncProvider>
                          <SidebarProvider>
                            <div className='flex h-screen w-full'>
                              <AppSidebar />
                              <main className='flex-1 overflow-auto'>
                                <div className='py-[5rem] px-4 sm:p-6 flex items-start'>
                                  <div className='hidden md:flex items-center gap-4 mb-4'>
                                    <SidebarTrigger />
                                  </div>
                                  <AuthGuard>{children}</AuthGuard>
                                </div>
                              </main>
                            </div>
                          </SidebarProvider>
                        </MonobankSyncProvider>
                      </WalletProvider>
                    </AuthProvider>
                  </QueryProvider>
                </LanguageProvider>
              </I18nHydrate>
            </I18nProvider>
          </PrivacyProvider>
        </ThemeProvider>
        <ClientToaster />
      </body>
    </html>
  )
}
