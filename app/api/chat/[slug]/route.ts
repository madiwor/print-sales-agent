import Anthropic from '@anthropic-ai/sdk'
import type { NextRequest } from 'next/server'
import { buildConversationPrompt } from '@/lib/agent/prompt-conversation'
import { buildExtractionPrompt } from '@/lib/agent/prompt-extract'
import { handleTool } from '@/lib/agent/tool-handlers'
import type { ChatRequest, ChatResponse, PortalInfo, RFQDraft } from '@/types/agent'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CONVERSATION_MODEL = 'claude-sonnet-4-6'
const EXTRACTION_MODEL   = 'claude-haiku-4-5-20251001'
const MAX_TOKENS         = 1000

async function getPortalInfo(slug: string): Promise<PortalInfo> {
  return (await handleTool('get_portal_info', {}, { converterSlug: slug })) as PortalInfo
}

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token }),
  })
  const data = await res.json() as { success: boolean }
  return data.success
}

async function extractRFQ(
  conversation: Anthropic.MessageParam[]
): Promise<RFQDraft | null> {
  try {
    const response = await anthropic.messages.create({
      model:      EXTRACTION_MODEL,
      max_tokens: 1000,
      system:     buildExtractionPrompt(),
      messages:   conversation,
    })
    const text = response.content.find(b => b.type === 'text')?.text ?? ''
    console.log('[Extractor] Raw response:', text.slice(0, 300))
    const parsed = JSON.parse(text) as RFQDraft
    return parsed
  } catch (err) {
    console.error('[Extractor] Error:', err)
    return null
  }
}

async function submitToFormspree(
  rfqDraft: RFQDraft,
  lead: { name: string; email: string } | undefined,
  portalInfo: PortalInfo
): Promise<boolean> {
  const endpoint = process.env.FORMSPREE_ENDPOINT
  if (!endpoint) {
    console.log('\n=== RFQ ENVIADA (no Formspree endpoint configured) ===')
    console.log(JSON.stringify({ lead, rfqDraft }, null, 2))
    console.log('=====================================================\n')
    return true
  }
  const payload = {
    _subject: `Nueva solicitud de cotización — ${portalInfo.company_name}`,
    nombre:        lead?.name ?? 'No especificado',
    email:         lead?.email ?? 'No especificado',
    producto:      rfqDraft.product,
    material:      rfqDraft.material,
    medidas:       rfqDraft.width_mm && rfqDraft.height_mm ? `${rfqDraft.width_mm}×${rfqDraft.height_mm} mm` : null,
    cantidad:      rfqDraft.quantity,
    colores:       rfqDraft.colors,
    acabado:       rfqDraft.finish,
    entrega:       rfqDraft.delivery_format,
    requerimientos: rfqDraft.special_requirements,
    fecha_limite:  rfqDraft.deadline,
    telefono:      rfqDraft.contact_phone ?? lead?.email,
  }
  console.log('[Formspree] Enviando a:', endpoint)
  console.log('[Formspree] Payload:', JSON.stringify(payload))
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    })
    const responseBody = await res.text()
    console.log('[Formspree] Status:', res.status, '| Response:', responseBody)
    return res.ok
  } catch (err) {
    console.error('[Formspree] Error:', err)
    return false
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  let body: ChatRequest & { lead?: { name: string; email: string }; turnstileToken?: string; rfqDraft?: RFQDraft | null }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { message, messages: prevMessages = [], lead, turnstileToken, rfqDraft: currentDraft } = body

  if (!message?.trim()) {
    return Response.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
  }

  if (turnstileToken) {
    const valid = await verifyTurnstile(turnstileToken)
    if (!valid) return Response.json({ error: 'Verificación fallida' }, { status: 403 })
  }

  let portalInfo: PortalInfo
  try {
    portalInfo = await getPortalInfo(slug)
  } catch {
    return Response.json({ error: 'Portal no encontrado' }, { status: 404 })
  }

  const systemPrompt = buildConversationPrompt(portalInfo, lead, currentDraft ?? null)

  const messages: Anthropic.MessageParam[] = [
    ...prevMessages,
    { role: 'user', content: message },
  ]

  try {
    // 1. Conversation call
    const convResponse = await anthropic.messages.create({
      model:      CONVERSATION_MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
      ],
      messages,
    })

    const rawText = convResponse.content.find(b => b.type === 'text')?.text ?? ''
    const shouldSubmit = rawText.includes('[SUBMIT_RFQ]')
    const responseText = rawText.replace('[SUBMIT_RFQ]', '').trim()

    const updatedMessages: Anthropic.MessageParam[] = [
      ...messages,
      { role: 'assistant', content: responseText },
    ]

    // 2. Extraction call (parallel with submission if needed)
    const [newDraft] = await Promise.all([
      extractRFQ(updatedMessages),
    ])

    // 3. Submit if agent signaled
    console.log(`[chat/${slug}] shouldSubmit=${shouldSubmit} | rfqReady=${newDraft?.ready_to_submit ?? false}`)
    if (shouldSubmit && newDraft) {
      await submitToFormspree(newDraft, lead, portalInfo)
    }

    const result: ChatResponse & { rfqDraft: RFQDraft | null } = {
      response: responseText,
      messages: updatedMessages,
      rfqDraft: newDraft,
    }

    return Response.json(result)
  } catch (err) {
    console.error(`[chat/${slug}] Error:`, err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
