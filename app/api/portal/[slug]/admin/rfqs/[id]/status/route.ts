import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updatePortalRFQStatus } from '@/lib/supabase/portal-admin'

const ALLOWED = ['submitted', 'in_progress', 'quoted', 'closed']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params

  // Verify Supabase Auth session
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(_items: { name: string; value: string; options?: CookieOptions }[]) {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.converter_slug !== slug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { status } = await request.json() as { status: string }
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const ok = await updatePortalRFQStatus(slug, id, status)
  if (!ok) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
