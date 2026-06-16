import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type CookieItem = { name: string; value: string; options?: CookieOptions }

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await request.json() as { email: string; password: string }

  const cookiesToSet: CookieItem[] = []

  const supabase = createServerClient(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)!,
    (process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(items: CookieItem[]) { cookiesToSet.push(...items) },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({
    email:    body.email,
    password: body.password,
  })

  if (error || !data.user) {
    return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 })
  }

  if (data.user.user_metadata?.converter_slug !== slug) {
    await supabase.auth.signOut()
    return NextResponse.json({ error: 'Sin acceso a este portal' }, { status: 403 })
  }

  const response = NextResponse.json({ ok: true })
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as any)
  )
  return response
}
