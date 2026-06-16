import { supabase } from '@/lib/supabase/client'
import type { RFQDraft } from '@/types/agent'

interface WebhookPayload {
  event:      'rfq.created'
  portal:     string
  rfq_id:     string | null
  contact:    { name: string; email: string; company: string | null }
  specs:      Record<string, unknown>
  created_at: string
}

async function attempt(url: string, payload: WebhookPayload): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'MadiworiAgent/1.0' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(10_000),
    })
    return { ok: res.ok, status: res.status }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

export async function sendRFQWebhook(
  webhookUrl:  string,
  converterId: string,
  slug:        string,
  rfqId:       string | null,
  lead:        { name: string; email: string; company?: string },
  draft:       RFQDraft,
): Promise<void> {
  const payload: WebhookPayload = {
    event:      'rfq.created',
    portal:     slug,
    rfq_id:     rfqId,
    contact:    { name: lead.name, email: lead.email, company: lead.company ?? null },
    specs:      draft as unknown as Record<string, unknown>,
    created_at: new Date().toISOString(),
  }

  const MAX_ATTEMPTS = 3
  const DELAYS = [0, 2000, 8000]

  let lastResult: { ok: boolean; status?: number; error?: string } = { ok: false }
  let attempts = 0

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, DELAYS[i]))
    attempts++
    lastResult = await attempt(webhookUrl, payload)
    if (lastResult.ok) break
  }

  supabase.from('webhook_logs').insert({
    converter_id: converterId,
    rfq_id:       rfqId,
    url:          webhookUrl,
    status_code:  lastResult.status ?? null,
    success:      lastResult.ok,
    attempts,
    error:        lastResult.error ?? null,
  }).then(
    () => {},
    (err: unknown) => console.error('[webhook_logs] insert error:', err)
  )

  if (!lastResult.ok) {
    console.error(`[webhook] Failed after ${attempts} attempts for portal ${slug}:`, lastResult.error ?? lastResult.status)
  } else {
    console.log(`[webhook] Sent to ${webhookUrl} for portal ${slug} (rfq_id=${rfqId})`)
  }
}
