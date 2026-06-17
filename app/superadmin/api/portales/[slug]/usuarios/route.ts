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

  // Get company name for the invite email
  const { data: converter } = await supabase
    .from('converters')
    .select('company_name')
    .eq('slug', slug)
    .single()

  const companyName = converter?.company_name ?? slug

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')

  // Generate invite link instead of sending Supabase's default email
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo: `${appUrl}/admin/accept-invite`,
      data: {
        converter_slug: slug,
        role: 'portal_admin',
      },
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

  const inviteLink = linkData.properties.action_link

  const { ok, error: mailError } = await sendInviteEmail(email, companyName, inviteLink)
  if (!ok) {
    return NextResponse.json({ error: `Error al enviar email: ${mailError}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
