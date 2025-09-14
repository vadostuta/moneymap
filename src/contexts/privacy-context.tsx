'use client'

import * as React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

type PrivacyProviderProps = {
  children: React.ReactNode
  defaultHidden?: boolean
  storageKey?: string
}

type PrivacyProviderState = {
  isHidden: boolean
  toggleHidden: () => void
  setHidden: (hidden: boolean) => void
  formatAmount: (amount: number, currency?: string, type?: string) => string
  formatBalance: (balance: number, currency?: string) => string
}

const initialState: PrivacyProviderState = {
  isHidden: false,
  toggleHidden: () => null,
  setHidden: () => null,
  formatAmount: () => '',
  formatBalance: () => ''
}

const PrivacyProviderContext = createContext<PrivacyProviderState>(initialState)

export function PrivacyProvider ({
  children,
  defaultHidden = false,
  storageKey = 'moneymap-privacy-hidden',
  ...props
}: PrivacyProviderProps) {
  const [isHidden, setIsHidden] = useState<boolean>(defaultHidden)

  useEffect(() => {
    const storedHidden = localStorage.getItem(storageKey)
    if (storedHidden !== null) {
      setIsHidden(storedHidden === 'true')
    }
  }, [storageKey])

  const toggleHidden = () => {
    const newHidden = !isHidden
    localStorage.setItem(storageKey, newHidden.toString())
    setIsHidden(newHidden)
  }

  const setHidden = (hidden: boolean) => {
    localStorage.setItem(storageKey, hidden.toString())
    setIsHidden(hidden)
  }

  const formatAmount = (amount: number, currency?: string, type?: string) => {
    if (isHidden) {
      return '***'
    }

    if (!currency) {
      return `${amount.toFixed(2)}`
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(Math.abs(amount))
    } catch (error) {
      console.error('Currency formatting error:', {
        amount,
        currency,
        type,
        error
      })
      return `${amount.toFixed(2)} ${currency}`
    }
  }

  const formatBalance = (balance: number, currency?: string) => {
    if (isHidden) {
      return '***'
    }

    if (!currency) {
      return balance.toFixed(2)
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(balance)
    } catch (error) {
      console.error('Currency formatting error:', { balance, currency, error })
      return `${balance.toFixed(2)} ${currency}`
    }
  }

  const value = {
    isHidden,
    toggleHidden,
    setHidden,
    formatAmount,
    formatBalance
  }

  return (
    <PrivacyProviderContext.Provider {...props} value={value}>
      {children}
    </PrivacyProviderContext.Provider>
  )
}

export const usePrivacy = () => {
  const context = useContext(PrivacyProviderContext)

  if (context === undefined)
    throw new Error('usePrivacy must be used within a PrivacyProvider')

  return context
}
