import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { syncRates } from '@/lib/services/fx/sync'

// Daily via Vercel cron (vercel.json), which sends
// `Authorization: Bearer $CRON_SECRET`. Also callable by any signed-in user
// as a manual trigger, optionally for a past date: /api/fx/sync?date=2026-09-30
export async function GET (req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error: Missing service role key' },
      { status: 500 }
    )
  }

  const dateParam = req.nextUrl.searchParams.get('date')
  const date = dateParam ? new Date(`${dateParam}T12:00:00Z`) : new Date()
  if (Number.isNaN(date.getTime()) || date > new Date()) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )

  const results = await syncRates(admin, date)
  const failed = results.some(result => result.error)
  return NextResponse.json({ results }, { status: failed ? 502 : 200 })
}

async function isAuthorized (req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') === `Bearer ${secret}`) {
    return true
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
  return Boolean(user)
}
