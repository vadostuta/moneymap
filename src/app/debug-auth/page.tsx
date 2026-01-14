'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    const info = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
      redirectUrl: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'N/A',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
    }
    setDebugInfo(info)
  }, [])

  const testSupabaseConnection = async () => {
    setTestResult('Testing...')
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setTestResult(`Error: ${error.message}`)
      } else {
        setTestResult(`Success! Session exists: ${!!data.session}`)
      }
    } catch (err: any) {
      setTestResult(`Error: ${err.message}`)
    }
  }

  const testGoogleOAuth = async () => {
    setTestResult('Testing Google OAuth...')
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account'
          }
        }
      })

      if (error) {
        setTestResult(`OAuth Error: ${error.message}`)
        console.error('Full error:', error)
      } else {
        setTestResult(`OAuth initiated! URL: ${data.url}`)
        console.log('OAuth data:', data)
      }
    } catch (err: any) {
      setTestResult(`Exception: ${err.message}`)
      console.error('Full exception:', err)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Auth Debug Page</h1>

      <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Environment Info</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tests</h2>
        <div className="flex gap-4 mb-4">
          <Button onClick={testSupabaseConnection}>
            Test Supabase Connection
          </Button>
          <Button onClick={testGoogleOAuth}>
            Test Google OAuth
          </Button>
        </div>
        {testResult && (
          <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <p className="font-mono text-sm whitespace-pre-wrap">{testResult}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
        <h3 className="font-semibold mb-2">Expected Configuration:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Supabase Dashboard → Authentication → URL Configuration</li>
          <li>Add to Redirect URLs: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">http://localhost:3000/auth/callback</code></li>
          <li>Add to Site URL: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">http://localhost:3000</code></li>
          <li>Google Cloud Console → OAuth 2.0 Client IDs → Add Authorized JavaScript origins: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">http://localhost:3000</code></li>
          <li>Google Cloud Console → Add Authorized redirect URIs: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">https://gbavpchseowftscgestw.supabase.co/auth/v1/callback</code></li>
        </ol>
      </div>
    </div>
  )
}
