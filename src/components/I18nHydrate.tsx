'use client'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export function I18nHydrate ({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation('common')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Wait until i18n is initialized and language is set
    if (i18n.isInitialized) {
      setReady(true)
    } else {
      const handleInit = () => setReady(true)
      i18n.on('initialized', handleInit)
      return () => i18n.off('initialized', handleInit)
    }
  }, [i18n])

  if (!ready) return null // or a loading spinner

  return <>{children}</>
}
