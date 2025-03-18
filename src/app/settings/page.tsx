'use client'

import { IntegrationsSection } from '@/components/settings/IntegrationsSection'
import { MonobankIntegration } from '@/components/settings/MonobankIntegration'
import { useState, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'

export default function SettingsPage () {
  const [shouldRefresh, setShouldRefresh] = useState(0)
  const [hasMonobankIntegration, setHasMonobankIntegration] = useState(false)

  const handleIntegrationAdded = useCallback(() => {
    setShouldRefresh(prev => prev + 1)
  }, [])

  const handleIntegrationsChange = useCallback((hasMonobank: boolean) => {
    setHasMonobankIntegration(hasMonobank)
  }, [])

  return (
    <div className='container mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-6'>Settings</h1>
      <div className='space-y-6 max-w-2xl'>
        {!hasMonobankIntegration && (
          <MonobankIntegration onSuccess={handleIntegrationAdded} />
        )}
        <IntegrationsSection
          refreshTrigger={shouldRefresh}
          onIntegrationsChange={handleIntegrationsChange}
        />
      </div>
      <Toaster />
    </div>
  )
}
