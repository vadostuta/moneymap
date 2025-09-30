import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '../src/lib/i18n'
import { WalletProvider } from '../src/contexts/wallet-context'
import { ThemeProvider } from '../src/contexts/theme-context'
import { LanguageProvider } from '../src/contexts/language-context'
import { PrivacyProvider } from '../src/contexts/privacy-context'
import { AuthProvider } from '../src/contexts/auth-context'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity
    }
  }
})

export const withProviders = (Story: React.ComponentType) => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <ThemeProvider defaultTheme='light' storageKey='moneymap-theme'>
        <PrivacyProvider
          defaultHidden={false}
          storageKey='moneymap-privacy-hidden'
        >
          <LanguageProvider>
            <AuthProvider>
              <WalletProvider>
                <Story />
              </WalletProvider>
            </AuthProvider>
          </LanguageProvider>
        </PrivacyProvider>
      </ThemeProvider>
    </I18nextProvider>
  </QueryClientProvider>
)
