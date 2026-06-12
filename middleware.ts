import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE = 'admin_token'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  if (!pathname.startsWith('/admin')) return NextResponse.next()

  const secret = process.env.ADMIN_SECRET
  if (!secret) return NextResponse.next() // no secret configured = open (dev)

  // Accept token via query param and set cookie
  const queryToken = searchParams.get('token')
  if (queryToken === secret) {
    const url = request.nextUrl.clone()
    url.searchParams.delete('token')
    const res = NextResponse.redirect(url)
    res.cookies.set(COOKIE, secret, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/admin',
    })
    return res
  }

  const cookieToken = request.cookies.get(COOKIE)?.value
  if (cookieToken === secret) return NextResponse.next()

  return new NextResponse('Unauthorized', { status: 401 })
}

export const config = { matcher: ['/admin', '/admin/:path*'] }
