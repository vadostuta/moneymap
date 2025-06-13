'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function AccountSettings () {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      setIsDeleting(true)
      try {
        // Call the API endpoint to delete the user
        const response = await fetch('/api/user/delete', {
          method: 'POST'
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete account')
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
            : 'Failed to delete account. Please try again later.'
        )
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className='space-y-6'>
      <div className='border-b pb-4'>
        <h2 className='text-xl font-semibold'>Account Settings</h2>
        <p className='text-muted-foreground'>
          Manage your account settings and preferences
        </p>
      </div>

      <div className='space-y-4'>
        <div className='border rounded-lg p-4'>
          <h3 className='text-lg font-medium mb-2'>Delete Account</h3>
          <p className='text-muted-foreground mb-4'>
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <Button
            variant='destructive'
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </div>
      </div>
    </div>
  )
}
