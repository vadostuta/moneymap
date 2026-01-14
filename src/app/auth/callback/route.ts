import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET (request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  console.log('Auth callback received:', { code: !!code, error, errorDescription })

  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${requestUrl.origin}?error=${error}`)
  }

  if (code) {
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
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
        }
      )

      console.log('Attempting to exchange code for session...')

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('❌ Failed to exchange code for session')
        console.error('Error message:', exchangeError.message)
        console.error('Error status:', exchangeError.status)
        console.error('Full error:', JSON.stringify(exchangeError, null, 2))
        return NextResponse.redirect(`${requestUrl.origin}?error=auth_failed&message=${encodeURIComponent(exchangeError.message)}`)
      }

      console.log('✅ Session exchanged successfully:', { userId: data?.user?.id, email: data?.user?.email })
    } catch (err: any) {
      console.error('❌ Unexpected error during session exchange')
      console.error('Exception:', err)
      console.error('Stack:', err.stack)
      return NextResponse.redirect(`${requestUrl.origin}?error=unexpected&message=${encodeURIComponent(err.message)}`)
    }
  }

  return NextResponse.redirect(requestUrl.origin)
}
