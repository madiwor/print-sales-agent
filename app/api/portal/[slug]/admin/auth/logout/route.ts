import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type CookieItem = Parameters<CookieMethodsServer['setAll']>[0][0]

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
        setAll(items: CookieItem[]) { cookiesToSet.push(...items) },
      },
    }
  )

  await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL(`/portal/${slug}/admin/login`, request.url))
  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
  return response
}
