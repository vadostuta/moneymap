import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Deletes the signed-in user's data and auth account. The client signs out
// and clears local state afterwards (AccountClient.tsx).
export async function POST () {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Delete user: missing SUPABASE_SERVICE_ROLE_KEY')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll () {
          return cookieStore.getAll()
        },
        setAll () {
          // Read-only here
        }
      }
    }
  )

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // delete_user_data is service_role only (20261009120000_security_lockdown.sql)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )

  const { error: dataError } = await admin.rpc('delete_user_data', {
    user_id_input: user.id
  })
  if (dataError) {
    console.error('Delete user: data', user.id, dataError)
    return NextResponse.json({ error: 'Failed to delete user data' }, { status: 500 })
  }

  const { error: authError } = await admin.auth.admin.deleteUser(user.id)
  if (authError) {
    console.error('Delete user: auth', user.id, authError)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
