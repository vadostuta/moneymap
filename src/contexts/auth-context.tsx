'use client'

import { createContext, JSX, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { commitPendingMethod, markPendingMethod } from '@/lib/auth/last-method'
import { usernameToEmail } from '@/lib/auth/username'

type AuthContextType = {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithPassword: (username: string, password: string) => Promise<void>
  signUpWithPassword: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider ({
  children
}: {
  children: React.ReactNode
}): JSX.Element {
  // 👈 Added return type JSX.Element
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') commitPendingMethod()
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])


  const signInWithGoogle = async () => {
    markPendingMethod('google')
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Google sign-in error:', error)
        throw error
      }

      console.log('Google sign-in initiated:', data)
    } catch (error) {
      console.error('Failed to sign in with Google:', error)
      throw error
    }
  }

  const signInWithPassword = async (username: string, password: string) => {
    markPendingMethod('password', username)
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password
    })
    if (error) throw error
  }

  const signUpWithPassword = async (username: string, password: string) => {
    markPendingMethod('password', username)
    const { error } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: { data: { username } }
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    signOut
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
