import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabase as adminSupabase } from '@/lib/supabase/client'

type CookieItem = { name: string; value: string; options?: CookieOptions }

async function getAuthorizedSlug(request: NextRequest, routeSlug: string): Promise<string | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (_items: CookieItem[]) => {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (user.user_metadata?.converter_slug !== routeSlug) return null
  return routeSlug
}

function escapeCSV(val: unknown): string {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function row(cols: unknown[]): string {
  return cols.map(escapeCSV).join(',')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const authorizedSlug = await getAuthorizedSlug(request, slug)
  if (!authorizedSlug) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const status    = searchParams.get('status') || null
  const dateFrom  = searchParams.get('from') || null
  const dateTo    = searchParams.get('to') || null

  // Lookup converter_id
  const { data: converter } = await adminSupabase
    .from('converters').select('id').eq('slug', slug).single()
  if (!converter) return new NextResponse('Not found', { status: 404 })

  let query = adminSupabase
    .from('rfqs')
    .select('created_at, contact_name, contact_email, contact_company, status, specs')
    .eq('converter_id', converter.id)
    .order('created_at', { ascending: false })

  if (status)   query = query.eq('status', status)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59Z')

  const { data, error } = await query
  if (error) return new NextResponse('Error', { status: 500 })

  const header = row([
    'Fecha', 'Nombre', 'Email', 'Empresa',
    'Producto', 'Material', 'Medidas', 'Cantidad',
    'Colores', 'Acabado', 'Entrega', 'Estado',
  ])

  const lines = (data ?? []).map(r => {
    const s = r.specs as Record<string, unknown>
    const medidas = s.width_mm && s.height_mm ? `${s.width_mm}×${s.height_mm}mm` : ''
    return row([
      new Date(r.created_at).toLocaleDateString('es-AR'),
      r.contact_name,
      r.contact_email,
      r.contact_company ?? '',
      s.product ?? '',
      s.material ?? '',
      medidas,
      s.quantity ?? '',
      s.colors ?? '',
      s.finish ?? '',
      s.delivery_format ?? '',
      r.status,
    ])
  })

  const csv = [header, ...lines].join('\n')
  const filename = `rfqs-${slug}-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
