import { supabase } from './client'
import type { RFQDraft } from '@/types/agent'

export async function saveRFQ(params: {
  converterSlug: string
  lead: { name: string; email: string; company?: string }
  draft: RFQDraft
}): Promise<string | null> {
  const { data: converter } = await supabase
    .from('converters')
    .select('id')
    .eq('slug', params.converterSlug)
    .single()

  if (!converter) return null

  const { data, error } = await supabase
    .from('rfqs')
    .insert({
      converter_id:    converter.id,
      contact_name:    params.lead.name,
      contact_email:   params.lead.email,
      contact_company: params.lead.company ?? null,
      specs:           params.draft,
      status:          'submitted',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[saveRFQ] Error:', error)
    return null
  }

  console.log('[saveRFQ] Guardada con ID:', data.id)
  return data.id
}
