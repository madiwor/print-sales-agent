import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { email } = await request.json() as { email: string }
  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) return NextResponse.json({ error: 'Error interno' }, { status: 500 })

  const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase().trim())
  if (!user) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const slug = user.user_metadata?.converter_slug
  if (!slug) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json({ slug })
}
