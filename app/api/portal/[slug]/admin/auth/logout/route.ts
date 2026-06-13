import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type CookieItem = { name: string; value: string; options?: Record<string, unknown> }

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const cookiesToSet: CookieItem[] = []

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(items) { items.forEach(i => cookiesToSet.push(i)) },
      },
    }
  )

  await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL(`/portal/${slug}/admin/login`, request.url))
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as any)
  )
  return response
}
