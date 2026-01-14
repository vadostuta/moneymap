import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST () {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json(
        { error: 'Authentication error', details: userError },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Deleting data for user:', user.id)

    // Delete user data using the database function
    const { error: deleteError } = await supabase.rpc('delete_user_data', {
      user_id_input: user.id
    })

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete user data', details: deleteError },
        { status: 500 }
      )
    }

    console.log('User data deleted successfully')

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase URL' },
        { status: 500 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Attempting to delete user with ID:', user.id)
    console.log('Using Supabase URL:', supabaseUrl)

    // Use the Management API with service role key
    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${user.id}`,
      {
        method: 'DELETE',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const responseData = await response.json()
    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Failed to delete auth user',
          details: {
            status: response.status,
            statusText: response.statusText,
            data: responseData
          }
        },
        { status: response.status }
      )
    }

    // Clear the session cookie
    cookieStore.delete('sb-access-token')
    cookieStore.delete('sb-refresh-token')

    console.log('Auth user deleted successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to delete user',
        details:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack
              }
            : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
