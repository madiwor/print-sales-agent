import { supabase } from './client'

export interface AdminRFQ {
  id:              string
  created_at:      string
  contact_name:    string
  contact_email:   string
  contact_company: string | null
  status:          string
  specs:           Record<string, unknown>
  converter:       { slug: string; company_name: string }
}

export interface AdminSession {
  id:            string
  created_at:    string
  updated_at:    string
  contact_email: string
  rfq_id:        string | null
  turn_count:    number
  converter:     { slug: string; company_name: string }
}

export interface AdminMetrics {
  rfqs_today:      number
  rfqs_week:       number
  rfqs_month:      number
  sessions_week:   number
  conversion_rate: number // sessions that produced an rfq / total sessions this week
  token_rows: {
    company_name:        string
    input_tokens:        number
    output_tokens:       number
    cache_read_tokens:   number
    cache_write_tokens:  number
    request_count:       number
    estimated_cost_usd:  number
  }[]
}

export async function listRFQs(params: {
  page: number
  pageSize: number
  converterSlug?: string
  status?: string
}): Promise<{ rows: AdminRFQ[]; total: number }> {
  const from = params.page * params.pageSize
  const to   = from + params.pageSize - 1

  let query = supabase
    .from('rfqs')
    .select('id, created_at, contact_name, contact_email, contact_company, status, specs, converters!inner(slug, company_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.converterSlug) query = query.eq('converters.slug', params.converterSlug)
  if (params.status)        query = query.eq('status', params.status)

  const { data, error, count } = await query
  if (error) { console.error('[listRFQs]', error); return { rows: [], total: 0 } }

  return {
    rows: (data ?? []).map((r: any) => ({ ...r, converter: r.converters })),
    total: count ?? 0,
  }
}

export async function getRFQ(id: string): Promise<AdminRFQ | null> {
  const { data, error } = await supabase
    .from('rfqs')
    .select('id, created_at, contact_name, contact_email, contact_company, status, specs, converters!inner(slug, company_name)')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return { ...(data as any), converter: (data as any).converters }
}

export async function updateRFQStatus(id: string, status: string): Promise<void> {
  await supabase.from('rfqs').update({ status }).eq('id', id)
}

export async function listSessions(params: {
  page: number
  pageSize: number
}): Promise<{ rows: AdminSession[]; total: number }> {
  const from = params.page * params.pageSize
  const to   = from + params.pageSize - 1

  const { data, error, count } = await supabase
    .from('agent_sessions')
    .select('id, created_at, updated_at, contact_email, rfq_id, messages, converters!inner(slug, company_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) { console.error('[listSessions]', error); return { rows: [], total: 0 } }

  return {
    rows: (data ?? []).map((r: any) => ({
      id:            r.id,
      created_at:    r.created_at,
      updated_at:    r.updated_at,
      contact_email: r.contact_email,
      rfq_id:        r.rfq_id,
      turn_count:    Array.isArray(r.messages) ? r.messages.length : 0,
      converter:     r.converters,
    })),
    total: count ?? 0,
  }
}

export async function getSession(id: string): Promise<{ session: AdminSession; messages: any[] } | null> {
  const { data, error } = await supabase
    .from('agent_sessions')
    .select('id, created_at, updated_at, contact_email, rfq_id, messages, converters!inner(slug, company_name)')
    .eq('id', id)
    .single()
  if (error || !data) return null
  const r = data as any
  return {
    session: {
      id:            r.id,
      created_at:    r.created_at,
      updated_at:    r.updated_at,
      contact_email: r.contact_email,
      rfq_id:        r.rfq_id,
      turn_count:    Array.isArray(r.messages) ? r.messages.length : 0,
      converter:     r.converters,
    },
    messages: Array.isArray(r.messages) ? r.messages : [],
  }
}

// Cost per million tokens (claude-sonnet-4-6)
const COST = { input: 3, output: 15, cache_read: 0.3, cache_write: 3.75 }

export async function getMetrics(): Promise<AdminMetrics> {
  const now   = new Date()
  const today = now.toISOString().slice(0, 10)
  const week  = new Date(now.getTime() - 7  * 86400000).toISOString().slice(0, 10)
  const month = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)

  const [rfqToday, rfqWeek, rfqMonth, sessWeek, tokenRows] = await Promise.all([
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).gte('created_at', week),
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).gte('created_at', month),
    supabase.from('agent_sessions').select('id, rfq_id', { count: 'exact' }).gte('created_at', week),
    supabase
      .from('converter_token_usage')
      .select('input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, request_count, converters!inner(company_name)')
      .gte('date', month),
  ])

  const sessTotal = sessWeek.count ?? 0
  const sessConverted = (sessWeek.data ?? []).filter((s: any) => s.rfq_id).length

  // Aggregate token rows per company
  const byCompany: Record<string, any> = {}
  for (const row of (tokenRows.data ?? []) as any[]) {
    const name = row.converters?.company_name ?? 'Desconocido'
    if (!byCompany[name]) byCompany[name] = { company_name: name, input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0, request_count: 0, estimated_cost_usd: 0 }
    byCompany[name].input_tokens        += row.input_tokens
    byCompany[name].output_tokens       += row.output_tokens
    byCompany[name].cache_read_tokens   += row.cache_read_tokens  ?? 0
    byCompany[name].cache_write_tokens  += row.cache_write_tokens ?? 0
    byCompany[name].request_count       += row.request_count
    byCompany[name].estimated_cost_usd  +=
      (row.input_tokens        / 1_000_000) * COST.input +
      (row.output_tokens       / 1_000_000) * COST.output +
      ((row.cache_read_tokens  ?? 0) / 1_000_000) * COST.cache_read +
      ((row.cache_write_tokens ?? 0) / 1_000_000) * COST.cache_write
  }

  return {
    rfqs_today:      rfqToday.count  ?? 0,
    rfqs_week:       rfqWeek.count   ?? 0,
    rfqs_month:      rfqMonth.count  ?? 0,
    sessions_week:   sessTotal,
    conversion_rate: sessTotal > 0 ? Math.round((sessConverted / sessTotal) * 100) : 0,
    token_rows:      Object.values(byCompany),
  }
}

export interface AdminPortal {
  id:                 string
  slug:               string
  company_name:       string
  contact_email:      string
  contact_phone:      string | null
  description:        string | null
  products_knowledge: string | null
  status:             string
  created_at:         string
}

export async function listPortales(): Promise<AdminPortal[]> {
  const { data } = await supabase
    .from('converters')
    .select('id, slug, company_name, contact_email, contact_phone, description, status, created_at')
    .order('created_at', { ascending: false })
  return (data ?? []) as AdminPortal[]
}

export async function getPortalDetail(slug: string): Promise<AdminPortal | null> {
  const { data } = await supabase
    .from('converters')
    .select('id, slug, company_name, contact_email, contact_phone, description, products_knowledge, status, created_at')
    .eq('slug', slug)
    .single()
  return data as AdminPortal | null
}

export async function createPortal(input: {
  slug:               string
  company_name:       string
  contact_email:      string
  contact_phone?:     string | null
  description?:       string | null
  products_knowledge?: string | null
  status:             string
}): Promise<{ slug: string } | { error: string }> {
  const { data, error } = await supabase
    .from('converters')
    .insert({
      slug:               input.slug,
      company_name:       input.company_name,
      contact_email:      input.contact_email,
      contact_phone:      input.contact_phone ?? null,
      description:        input.description ?? null,
      products_knowledge: input.products_knowledge ?? null,
      status:             input.status,
      agent_name:         'Sofía',
      agent_language:     'es',
    })
    .select('id, slug')
    .single()

  if (error) return { error: error.message }

  // create default converter_config
  await supabase.from('converter_config').insert({ converter_id: data.id })

  return { slug: data.slug }
}

export interface PortalConfig {
  min_quantity:   number
  max_width_mm:   number
  max_colors:     number
  lead_time_days: number
}

export async function getPortalConfig(slug: string): Promise<PortalConfig | null> {
  const { data: converter } = await supabase
    .from('converters').select('id').eq('slug', slug).single()
  if (!converter) return null

  const { data } = await supabase
    .from('converter_config')
    .select('min_quantity, max_width_mm, max_colors, lead_time_days')
    .eq('converter_id', converter.id)
    .single()
  return data as PortalConfig | null
}

export async function updatePortal(
  slug: string,
  input: {
    company_name?:        string
    contact_email?:       string
    contact_phone?:       string | null
    description?:         string | null
    products_knowledge?:  string | null
    status?:              string
    min_quantity?:        number
    max_width_mm?:        number
    max_colors?:          number
    lead_time_days?:      number
    tone?:                string
    extra_instructions?:  string | null
    restrictions?:        string | null
  }
): Promise<{ ok: true } | { error: string }> {
  const { data: converter, error: convErr } = await supabase
    .from('converters').select('id').eq('slug', slug).single()
  if (convErr || !converter) return { error: 'Portal no encontrado' }

  const { min_quantity, max_width_mm, max_colors, lead_time_days, ...converterFields } = input

  const { error: updateErr } = await supabase
    .from('converters').update(converterFields).eq('id', converter.id)
  if (updateErr) return { error: updateErr.message }

  const configFields: Partial<PortalConfig> = {}
  if (min_quantity   != null) configFields.min_quantity   = min_quantity
  if (max_width_mm   != null) configFields.max_width_mm   = max_width_mm
  if (max_colors     != null) configFields.max_colors     = max_colors
  if (lead_time_days != null) configFields.lead_time_days = lead_time_days

  if (Object.keys(configFields).length > 0) {
    await supabase.from('converter_config')
      .update(configFields).eq('converter_id', converter.id)
  }

  return { ok: true }
}
