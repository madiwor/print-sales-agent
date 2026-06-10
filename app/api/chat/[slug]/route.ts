import Anthropic from '@anthropic-ai/sdk'
import type { NextRequest } from 'next/server'
import { buildConversationPrompt } from '@/lib/agent/prompt-conversation'
import { buildExtractionPrompt } from '@/lib/agent/prompt-extract'
import { handleTool } from '@/lib/agent/tool-handlers'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import type { ChatRequest, ChatResponse, PortalInfo, RFQDraft } from '@/types/agent'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CONVERSATION_MODEL = 'claude-sonnet-4-6'
const EXTRACTION_MODEL   = 'claude-haiku-4-5-20251001'
const MAX_TOKENS         = 1000

// Límites anti-abuso: el endpoint es público y cada request consume tokens de la API
const MAX_REQUESTS_PER_MINUTE = 10   // por IP
const MAX_MESSAGE_CHARS       = 2000 // un RFQ real nunca necesita más
const MAX_CONVERSATION_TURNS  = 60   // mensajes acumulados (user + assistant)

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

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: 'extract_rfq',
  description: 'Extrae los datos estructurados de la solicitud de cotización de la conversación.',
  input_schema: {
    type: 'object' as const,
    properties: {
      product:              { type: 'string',  description: 'Tipo de producto' },
      quantity:             { type: 'string',  description: 'Cantidad solicitada' },
      width_mm:             { type: 'number',  description: 'Ancho en mm' },
      height_mm:            { type: 'number',  description: 'Alto en mm' },
      material:             { type: 'string',  description: 'Material tal como lo dijo el cliente' },
      colors:               { type: 'number',  description: 'Número de colores. 0 = sin impresión.' },
      finish:               { type: 'string',  description: 'Acabado solicitado' },
      die_cut:              { type: 'string',  description: 'Forma del troquel' },
      has_artwork:          { type: 'boolean', description: 'Si el cliente ya tiene el diseño' },
      special_requirements: { type: 'string',  description: 'Requerimientos especiales' },
      deadline:             { type: 'string',  description: 'Fecha límite' },
      delivery_format:      { type: 'string',  description: 'rollo o hoja' },
      contact_name:         { type: 'string',  description: 'Nombre del contacto' },
      contact_email:        { type: 'string',  description: 'Email del contacto' },
      contact_phone:        { type: 'string',  description: 'Teléfono del contacto' },
      status:               { type: 'string',  enum: ['incomplete', 'needs_clarification', 'ready_to_send'] },
      missing_fields:       { type: 'array', items: { type: 'string' }, description: 'Campos críticos faltantes' },
      ready_to_submit:      { type: 'boolean', description: 'true si tiene material, quantity y al menos una dimensión' },
    },
    required: ['status', 'missing_fields', 'ready_to_submit'],
  },
}

async function extractRFQ(
  conversation: Anthropic.MessageParam[]
): Promise<RFQDraft | null> {
  const messages = conversation[0]?.role === 'assistant'
    ? conversation.slice(1)
    : conversation
  if (messages.length === 0) return null
  try {
    const response = await anthropic.messages.create({
      model:       EXTRACTION_MODEL,
      max_tokens:  2000,
      system:      'Extraé los datos de la solicitud de cotización llamando a extract_rfq. Usá exactamente los valores que dijo el cliente.',
      messages,
      tools:       [EXTRACTION_TOOL],
      tool_choice: { type: 'any' },
    })
    const toolUse = response.content.find(b => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      console.error('[Extractor] No tool_use block in response')
      return null
    }
    console.log('[Extractor] OK, ready_to_submit:', (toolUse.input as RFQDraft).ready_to_submit)
    return toolUse.input as RFQDraft
  } catch (err) {
    console.error('[Extractor] Error:', err)
    return null
  }
}

async function submitToFormspree(
  rfqDraft: RFQDraft,
  lead: { name: string; email: string; company?: string } | undefined,
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
    empresa:       rfqDraft.company_name ?? lead?.company ?? null,
    tipo_producto: rfqDraft.product_type,
    producto:      rfqDraft.product,
    material:      rfqDraft.material,
    medidas:       rfqDraft.width_mm && rfqDraft.height_mm ? `${rfqDraft.width_mm}×${rfqDraft.height_mm} mm` : null,
    cantidad:      rfqDraft.quantity,
    colores:       rfqDraft.colors,
    acabado:       rfqDraft.finish,
    entrega:       rfqDraft.delivery_format,
    requerimientos: rfqDraft.special_requirements,
    fecha_limite:  rfqDraft.deadline,
    telefono:      rfqDraft.contact_phone ?? null,
    tipo_impresora: (rfqDraft as any).printer_type ?? null,
    tipo_ribbon:    (rfqDraft as any).ribbon_type ?? null,
    ribbon_medidas: (rfqDraft as any).ribbon_width_mm ? `${(rfqDraft as any).ribbon_width_mm}mm × ${(rfqDraft as any).ribbon_length_m}m` : null,
    impresora_marca_modelo: (rfqDraft as any).printer_brand_model ?? null,
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

  const ip = getClientIp(request)
  const limit = checkRateLimit(`chat:${ip}`, MAX_REQUESTS_PER_MINUTE)
  if (!limit.allowed) {
    console.warn(`[chat/${slug}] Rate limit excedido para IP ${ip}`)
    return Response.json(
      { error: 'Demasiados mensajes. Esperá un momento e intentá de nuevo.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  let body: ChatRequest & { lead?: { name: string; email: string; company?: string }; turnstileToken?: string; rfqDraft?: RFQDraft | null }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { message, messages: prevMessages = [], lead, turnstileToken, rfqDraft: currentDraft } = body

  if (!message?.trim()) {
    return Response.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
  }

  if (message.length > MAX_MESSAGE_CHARS) {
    return Response.json(
      { error: `El mensaje es demasiado largo (máximo ${MAX_MESSAGE_CHARS} caracteres).` },
      { status: 400 }
    )
  }

  if (prevMessages.length > MAX_CONVERSATION_TURNS) {
    return Response.json(
      { error: 'La conversación alcanzó su límite. Por favor recargá la página para empezar de nuevo.' },
      { status: 400 }
    )
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
