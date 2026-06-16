import { supabase } from './client'

const PAGE_SIZE = 25

export interface PortalRFQ {
  id:              string
  created_at:      string
  contact_name:    string
  contact_email:   string
  contact_company: string | null
  status:          string
  specs:           Record<string, unknown>
}

export interface PortalSession {
  id:            string
  created_at:    string
  contact_email: string
  rfq_id:        string | null
  turn_count:    number
}

export interface PortalMetrics {
  rfqs_today:      number
  rfqs_week:       number
  rfqs_month:      number
  sessions_week:   number
  conversion_rate: number
  recent_rfqs:     PortalRFQ[]
  rfqs_by_status:  Record<string, number>
}

async function getConverterId(slug: string): Promise<string | null> {
  const { data } = await supabase.from('converters').select('id').eq('slug', slug).single()
  return data?.id ?? null
}

export async function listPortalRFQs(
  slug: string,
  page = 0,
  status?: string
): Promise<{ rows: PortalRFQ[]; total: number }> {
  const converterId = await getConverterId(slug)
  if (!converterId) return { rows: [], total: 0 }

  const from = page * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = supabase
    .from('rfqs')
    .select('id, created_at, contact_name, contact_email, contact_company, status, specs', { count: 'exact' })
    .eq('converter_id', converterId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
  if (error) { console.error('[listPortalRFQs]', error); return { rows: [], total: 0 } }
  return { rows: (data ?? []) as PortalRFQ[], total: count ?? 0 }
}

export async function getPortalRFQ(slug: string, id: string): Promise<PortalRFQ | null> {
  const converterId = await getConverterId(slug)
  if (!converterId) return null

  const { data, error } = await supabase
    .from('rfqs')
    .select('id, created_at, contact_name, contact_email, contact_company, status, specs')
    .eq('id', id)
    .eq('converter_id', converterId)
    .single()

  if (error || !data) return null
  return data as PortalRFQ
}

export async function updatePortalRFQStatus(slug: string, id: string, status: string): Promise<boolean> {
  const converterId = await getConverterId(slug)
  if (!converterId) return false

  const { error } = await supabase
    .from('rfqs')
    .update({ status })
    .eq('id', id)
    .eq('converter_id', converterId)

  return !error
}

export async function listPortalSessions(
  slug: string,
  page = 0
): Promise<{ rows: PortalSession[]; total: number }> {
  const converterId = await getConverterId(slug)
  if (!converterId) return { rows: [], total: 0 }

  const from = page * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const { data, count, error } = await supabase
    .from('agent_sessions')
    .select('id, created_at, contact_email, rfq_id, messages', { count: 'exact' })
    .eq('converter_id', converterId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) { console.error('[listPortalSessions]', error); return { rows: [], total: 0 } }

  return {
    rows: (data ?? []).map((r: any) => ({
      id:            r.id,
      created_at:    r.created_at,
      contact_email: r.contact_email,
      rfq_id:        r.rfq_id,
      turn_count:    Array.isArray(r.messages) ? r.messages.length : 0,
    })),
    total: count ?? 0,
  }
}

export async function getPortalSession(
  slug: string,
  id: string
): Promise<{ session: PortalSession; messages: any[] } | null> {
  const converterId = await getConverterId(slug)
  if (!converterId) return null

  const { data, error } = await supabase
    .from('agent_sessions')
    .select('id, created_at, contact_email, rfq_id, messages')
    .eq('id', id)
    .eq('converter_id', converterId)
    .single()

  if (error || !data) return null
  const r = data as any
  return {
    session: {
      id:            r.id,
      created_at:    r.created_at,
      contact_email: r.contact_email,
      rfq_id:        r.rfq_id,
      turn_count:    Array.isArray(r.messages) ? r.messages.length : 0,
    },
    messages: Array.isArray(r.messages) ? r.messages : [],
  }
}

export async function getPortalMetrics(slug: string): Promise<PortalMetrics> {
  const converterId = await getConverterId(slug)
  if (!converterId) return { rfqs_today: 0, rfqs_week: 0, rfqs_month: 0, sessions_week: 0, conversion_rate: 0, recent_rfqs: [], rfqs_by_status: {} }

  const now   = new Date()
  const today = now.toISOString().slice(0, 10)
  const week  = new Date(now.getTime() - 7  * 86400000).toISOString().slice(0, 10)
  const month = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)

  const [rfqToday, rfqWeek, rfqMonth, sessWeek, recent, allStatuses] = await Promise.all([
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).eq('converter_id', converterId).gte('created_at', today),
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).eq('converter_id', converterId).gte('created_at', week),
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).eq('converter_id', converterId).gte('created_at', month),
    supabase.from('agent_sessions').select('id, rfq_id').eq('converter_id', converterId).gte('created_at', week),
    supabase.from('rfqs').select('id, created_at, contact_name, contact_email, contact_company, status, specs').eq('converter_id', converterId).order('created_at', { ascending: false }).limit(5),
    supabase.from('rfqs').select('status').eq('converter_id', converterId),
  ])

  const sessTotal     = (sessWeek.data ?? []).length
  const sessConverted = (sessWeek.data ?? []).filter((s: any) => s.rfq_id).length

  const rfqs_by_status: Record<string, number> = {}
  for (const r of (allStatuses.data ?? [])) {
    rfqs_by_status[r.status] = (rfqs_by_status[r.status] ?? 0) + 1
  }

  return {
    rfqs_today:      rfqToday.count  ?? 0,
    rfqs_week:       rfqWeek.count   ?? 0,
    rfqs_month:      rfqMonth.count  ?? 0,
    sessions_week:   sessTotal,
    conversion_rate: sessTotal > 0 ? Math.round((sessConverted / sessTotal) * 100) : 0,
    recent_rfqs:     (recent.data ?? []) as PortalRFQ[],
    rfqs_by_status,
  }
}
