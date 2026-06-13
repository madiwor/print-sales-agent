import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(items) {
          items.forEach(item => cookiesToSet.push(item as typeof cookiesToSet[0]))
        },
      },
    }
  )

  await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL(`/portal/${slug}/admin/login`, request.url))
  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options as any))
  return response
}
