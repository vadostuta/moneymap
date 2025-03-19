'use client'

import { IntegrationsSection } from '@/components/settings/IntegrationsSection'
import { MonobankIntegration } from '@/components/settings/MonobankIntegration'
import { useState, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'

export default function SettingsPage () {
  const [shouldRefresh, setShouldRefresh] = useState(0)
  const [hasMonobankIntegration, setHasMonobankIntegration] = useState<
    boolean | null
  >(null)

  const handleIntegrationAdded = useCallback(() => {
    setShouldRefresh(prev => prev + 1)
  }, [])

  const handleIntegrationsChange = useCallback((hasMonobank: boolean) => {
    console.log('Integration status changed:', hasMonobank)
    setHasMonobankIntegration(hasMonobank)
  }, [])

  return (
    <div className='container mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-6'>Settings</h1>
      <div className='space-y-6 max-w-2xl'>
        <IntegrationsSection
          refreshTrigger={shouldRefresh}
          onIntegrationsChange={handleIntegrationsChange}
        />

        {hasMonobankIntegration === null ? (
          <div className='animate-pulse'>
            <div className='h-12 bg-muted rounded-lg mb-4'></div>
            <div className='h-32 bg-muted rounded-lg'></div>
          </div>
        ) : (
          !hasMonobankIntegration && (
            <MonobankIntegration onSuccess={handleIntegrationAdded} />
          )
        )}
      </div>
      <Toaster />
    </div>
  )
}
