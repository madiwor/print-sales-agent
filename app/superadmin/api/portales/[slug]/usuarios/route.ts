import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendInviteEmail } from '@/lib/email/invite-mailer'

const SUPERADMIN_COOKIE = 'superadmin_token'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return request.cookies.get(SUPERADMIN_COOKIE)?.value === secret
}

function getAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const supabase = getAdminClient()
  if (!supabase) return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 })

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const users = (data.users ?? [])
    .filter(u => u.user_metadata?.converter_slug === slug)
    .map(u => ({ id: u.id, email: u.email ?? '', created_at: u.created_at, confirmed: !!u.email_confirmed_at }))

  return NextResponse.json({ users })
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

  const { data: converter } = await supabase
    .from('converters')
    .select('company_name')
    .eq('slug', slug)
    .single()

  const companyName = converter?.company_name ?? slug
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo: `${appUrl}/admin/accept-invite`,
      data: { converter_slug: slug, role: 'portal_admin' },
    },
  })

  if (linkError) {
    const isDuplicate =
      linkError.message.toLowerCase().includes('already registered') ||
      linkError.message.toLowerCase().includes('already been registered')
    return NextResponse.json(
      { error: isDuplicate ? `El email ${email} ya tiene una cuenta` : linkError.message },
      { status: isDuplicate ? 409 : 500 }
    )
  }

  const { ok, error: mailError } = await sendInviteEmail(email, companyName, linkData.properties.action_link)
  if (!ok) {
    return NextResponse.json({ error: `Error al enviar email: ${mailError}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })

  const supabase = getAdminClient()
  if (!supabase) return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 })

  // Verify user belongs to this portal before deleting
  const { data: userData } = await supabase.auth.admin.getUserById(userId)
  if (userData.user?.user_metadata?.converter_slug !== slug) {
    return NextResponse.json({ error: 'Usuario no pertenece a este portal' }, { status: 403 })
  }

  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
