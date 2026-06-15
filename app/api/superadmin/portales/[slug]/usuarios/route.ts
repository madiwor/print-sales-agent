import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPERADMIN_COOKIE = 'superadmin_token'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return request.cookies.get(SUPERADMIN_COOKIE)?.value === secret
}

function getAdminClient() {
  const url  = process.env.SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const { email } = await request.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  const supabase = getAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/portal/${slug}/admin`,
    data: {
      converter_slug: slug,
      role:           'portal_admin',
    },
  })

  if (error) {
    const isDuplicate = error.message.toLowerCase().includes('already registered') ||
                        error.message.toLowerCase().includes('already been registered')
    return NextResponse.json(
      { error: isDuplicate ? `El email ${email} ya tiene una cuenta` : error.message },
      { status: isDuplicate ? 409 : 500 }
    )
  }

  return NextResponse.json({ id: data.user.id }, { status: 201 })
}
