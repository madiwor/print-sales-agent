import { NextRequest, NextResponse } from 'next/server'
import { createPortal } from '@/lib/supabase/admin'

const SUPERADMIN_COOKIE = 'superadmin_token'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return request.cookies.get(SUPERADMIN_COOKIE)?.value === secret
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { slug, company_name, contact_email, contact_phone, description, products_knowledge, status } = body

  if (!slug || !company_name || !contact_email) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'El slug solo puede contener letras minúsculas, números y guiones' }, { status: 400 })
  }

  const result = await createPortal({ slug, company_name, contact_email, contact_phone, description, products_knowledge, status: status ?? 'active' })

  if ('error' in result) {
    const isDuplicate = result.error.includes('unique') || result.error.includes('duplicate')
    return NextResponse.json(
      { error: isDuplicate ? `El slug "${slug}" ya está en uso` : result.error },
      { status: isDuplicate ? 409 : 500 }
    )
  }

  return NextResponse.json({ slug: result.slug }, { status: 201 })
}
