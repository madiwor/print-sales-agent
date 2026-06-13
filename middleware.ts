import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SUPERADMIN_COOKIE = 'superadmin_token'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Superadmin: protected with ADMIN_SECRET env var
  if (pathname.startsWith('/superadmin')) {
    const secret = process.env.ADMIN_SECRET
    if (!secret) return NextResponse.next() // no secret = open in dev

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

  // Portal client admin: auth handled by Supabase Auth (issue #37)
  // For now, routes under /portal/[slug]/admin are unprotected placeholders
  return NextResponse.next()
}

export const config = {
  matcher: ['/superadmin', '/superadmin/:path*', '/portal/:slug/admin', '/portal/:slug/admin/:path*'],
}
