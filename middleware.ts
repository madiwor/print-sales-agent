import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const SUPERADMIN_COOKIE = 'superadmin_token'

type CookieItem = { name: string; value: string; options?: CookieOptions }

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // ── Superadmin (Madiwor only) ─────────────────────────────────────────────
  if (pathname.startsWith('/superadmin')) {
    const secret = process.env.ADMIN_SECRET
    if (!secret) return NextResponse.next()

    const queryToken = searchParams.get('token')
    if (queryToken === secret) {
      const url = request.nextUrl.clone()
      url.searchParams.delete('token')
      const res = NextResponse.redirect(url)
      res.cookies.set(SUPERADMIN_COOKIE, secret, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 8,
        path: '/superadmin',
      })
      return res
    }

    const cookieToken = request.cookies.get(SUPERADMIN_COOKIE)?.value
    if (cookieToken === secret) return NextResponse.next()
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // ── Portal client admin (Supabase Auth) ───────────────────────────────────
  const portalMatch = pathname.match(/^\/portal\/([^/]+)\/admin/)
  if (portalMatch) {
    const slug = portalMatch[1]

    if (
      pathname.endsWith('/admin/login') ||
      pathname.includes('/admin/auth/')
    ) {
      return NextResponse.next()
    }

    const supabaseUrl  = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnon = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnon) return NextResponse.next()

    let response = NextResponse.next({ request })

    const supabase = createServerClient(supabaseUrl, supabaseAnon, {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: CookieItem[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as any)
          )
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL(`/portal/${slug}/admin/login`, request.url))
    }

    if (user.user_metadata?.converter_slug !== slug) {
      return NextResponse.redirect(new URL(`/portal/${slug}/admin/login`, request.url))
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/superadmin',
    '/superadmin/:path*',
    '/portal/:slug/admin',
    '/portal/:slug/admin/:path*',
  ],
}
