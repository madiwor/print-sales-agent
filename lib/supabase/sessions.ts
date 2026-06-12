import { supabase } from './client'
import type Anthropic from '@anthropic-ai/sdk'

export async function upsertSession(params: {
  sessionId: string | null
  converterSlug: string
  contactEmail: string
  messages: Anthropic.MessageParam[]
  rfqId?: string | null
}): Promise<string> {
  if (params.sessionId) {
    await supabase
      .from('agent_sessions')
      .update({
        messages:   params.messages,
        rfq_id:     params.rfqId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.sessionId)
    return params.sessionId
  }

  const { data: converter } = await supabase
    .from('converters')
    .select('id')
    .eq('slug', params.converterSlug)
    .single()

  if (!converter) throw new Error('Converter not found')

  const { data } = await supabase
    .from('agent_sessions')
    .insert({
      converter_id:  converter.id,
      contact_email: params.contactEmail,
      messages:      params.messages,
    })
    .select('id')
    .single()

  return data!.id
}
