'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from 'react-i18next'

export default function AccountSettings () {
  const { t } = useTranslation('common')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    if (window.confirm(t('settings.account.deleteConfirm'))) {
      setIsDeleting(true)
      try {
        // Call the API endpoint to delete the user
        const response = await fetch('/api/user/delete', {
          method: 'POST'
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || t('settings.account.deleteError'))
        }

        // Sign out from Supabase
        await supabase.auth.signOut()

        // Clear all local storage
        localStorage.clear()
        sessionStorage.clear()

        // Clear all cookies
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.split('=')
          document.cookie = `${name.trim()}=;expires=${new Date(
            0
          ).toUTCString()};path=/`
        })

        // Force a hard refresh to clear any cached state
        window.location.href = '/'
      } catch (error) {
        console.error('Failed to delete account:', error)
        alert(
          error instanceof Error
            ? error.message
            : t('settings.account.deleteErrorGeneric')
        )
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className='space-y-6'>
      <div className='border-b pb-4'>
        <h2 className='text-xl font-semibold'>{t('settings.account.title')}</h2>
        <p className='text-muted-foreground'>
          {t('settings.account.description')}
        </p>
      </div>

      <div className='space-y-4'>
        <div className='border rounded-lg p-4'>
          <h3 className='text-lg font-medium mb-2'>
            {t('settings.account.deleteTitle')}
          </h3>
          <p className='text-muted-foreground mb-4'>
            {t('settings.account.deleteDescription')}
          </p>
          <Button
            variant='destructive'
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting
              ? t('settings.account.deleting')
              : t('settings.account.delete')}
          </Button>
        </div>
      </div>
    </div>
  )
}
