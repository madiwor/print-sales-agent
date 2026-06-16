import { NextRequest, NextResponse } from 'next/server'
import { updatePortal } from '@/lib/supabase/admin'

const SUPERADMIN_COOKIE = 'superadmin_token'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return request.cookies.get(SUPERADMIN_COOKIE)?.value === secret
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const body = await request.json()

  const result = await updatePortal(slug, body)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
