import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import type { NextRequest } from 'next/server'
import { buildSystemPromptV2 } from '@/lib/agent/prompt-v2'
import { CLIENT_TOOLS } from '@/lib/agent/client-tools'
import { handleTool } from '@/lib/agent/tool-handlers'
import type { ChatRequest, ChatResponse, PortalInfo } from '@/types/agent'

// ---------------------------------------------------------------------------
// Provider selection — set CHAT_PROVIDER=openai in .env to use GPT-4o
// ---------------------------------------------------------------------------
const PROVIDER = (process.env.CHAT_PROVIDER ?? 'anthropic') as 'anthropic' | 'openai'

const ANTHROPIC_MODEL     = 'claude-sonnet-4-6'
const OPENAI_MODEL        = 'gpt-4o'
const MAX_TOKENS          = 1000
const MAX_TOOL_ITERATIONS = 10

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
let _openai: OpenAI | null = null
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

// ---------------------------------------------------------------------------
// OpenAI tool definition (same schema, different wrapper format)
// ---------------------------------------------------------------------------
const OPENAI_TOOLS: OpenAI.Chat.ChatCompletionTool[] = CLIENT_TOOLS.map(t => ({
  type: 'function' as const,
  function: {
    name:        t.name,
    description: t.description,
    parameters:  t.input_schema as Record<string, unknown>,
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function getPortalInfo(slug: string): Promise<PortalInfo> {
  return (await handleTool('get_portal_info', {}, { converterSlug: slug })) as PortalInfo
}

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // skip in dev if not configured

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token }),
  })
  const data = await res.json() as { success: boolean }
  return data.success
}

// ---------------------------------------------------------------------------
// Anthropic loop
// ---------------------------------------------------------------------------
async function runAnthropicLoop(
  systemPrompt: string,
  messages: Anthropic.MessageParam[],
  slug: string
): Promise<{ responseText: string; messages: Anthropic.MessageParam[] }> {
  let iterations = 0
  let response!: Anthropic.Message

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++

    response = await anthropic.messages.create({
      model:      ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
      ],
      messages,
      tools: CLIENT_TOOLS,
    })

    if (response.stop_reason !== 'tool_use') break

    messages.push({ role: 'assistant', content: response.content })

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue
      let result: unknown
      try {
        result = await handleTool(block.name, block.input as Record<string, unknown>, { converterSlug: slug })
      } catch (err) {
        result = { error: err instanceof Error ? err.message : 'Error desconocido' }
      }
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
    }

    messages.push({ role: 'user', content: toolResults })
  }

  const textBlock = response.content.find(b => b.type === 'text')
  const responseText = textBlock?.type === 'text'
    ? textBlock.text
    : 'No pude generar una respuesta. Por favor intentá de nuevo.'

  return { responseText, messages }
}

// ---------------------------------------------------------------------------
// OpenAI loop
// ---------------------------------------------------------------------------
type OAIMessage = OpenAI.Chat.ChatCompletionMessageParam

async function runOpenAILoop(
  systemPrompt: string,
  prevMessages: Anthropic.MessageParam[],
  userMessage: string,
  slug: string
): Promise<{ responseText: string; messages: Anthropic.MessageParam[] }> {
  // Convert Anthropic message format → OpenAI format for the history
  const oaiMessages: OAIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...prevMessages.flatMap((m): OAIMessage[] => {
      if (typeof m.content === 'string') {
        return [{ role: m.role as 'user' | 'assistant', content: m.content }]
      }
      // Skip tool_result blocks from history (OpenAI handles them differently)
      return []
    }),
    { role: 'user', content: userMessage },
  ]

  let iterations = 0

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++

    const response = await getOpenAI().chat.completions.create({
      model:      OPENAI_MODEL,
      max_tokens: MAX_TOKENS,
      messages:   oaiMessages,
      tools:      OPENAI_TOOLS,
    })

    const choice = response.choices[0]
    const msg    = choice.message
    oaiMessages.push(msg as OAIMessage)

    if (choice.finish_reason !== 'tool_calls' || !msg.tool_calls?.length) break

    const toolResults: OAIMessage[] = []
    for (const tc of msg.tool_calls) {
      let result: unknown
      // tc is ChatCompletionMessageFunctionToolCall | ChatCompletionMessageCustomToolCall
      // We only emit standard function tools so the cast is safe
      const ftc = tc as OpenAI.Chat.ChatCompletionMessageFunctionToolCall
      try {
        const input = JSON.parse(ftc.function.arguments || '{}') as Record<string, unknown>
        result = await handleTool(ftc.function.name, input, { converterSlug: slug })
      } catch (err) {
        result = { error: err instanceof Error ? err.message : 'Error desconocido' }
      }
      toolResults.push({
        role:         'tool',
        tool_call_id: ftc.id,
        content:      JSON.stringify(result),
      })
    }

    oaiMessages.push(...toolResults)
  }

  const lastAssistant = [...oaiMessages].reverse().find(m => m.role === 'assistant')
  const responseText  = typeof lastAssistant?.content === 'string' && lastAssistant.content
    ? lastAssistant.content
    : 'No pude generar una respuesta. Por favor intentá de nuevo.'

  // Reconstruct Anthropic-format message history for the client (so the
  // frontend can keep sending the same shape regardless of provider)
  const anthropicMessages: Anthropic.MessageParam[] = [
    ...prevMessages,
    { role: 'user',      content: userMessage },
    { role: 'assistant', content: responseText },
  ]

  return { responseText, messages: anthropicMessages }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  let body: ChatRequest
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { message, messages: prevMessages = [], lead, turnstileToken } = body as ChatRequest & { lead?: { name: string; email: string }; turnstileToken?: string }

  if (!message?.trim()) {
    return Response.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
  }

  if (turnstileToken) {
    const valid = await verifyTurnstile(turnstileToken)
    if (!valid) {
      return Response.json({ error: 'Verificación de seguridad fallida' }, { status: 403 })
    }
  }

  let portalInfo: PortalInfo
  try {
    portalInfo = await getPortalInfo(slug)
  } catch {
    return Response.json({ error: 'Portal no encontrado' }, { status: 404 })
  }

  const systemPrompt = buildSystemPromptV2(portalInfo, lead)

  try {
    let responseText: string
    let messages: Anthropic.MessageParam[]

    if (PROVIDER === 'openai') {
      ;({ responseText, messages } = await runOpenAILoop(systemPrompt, prevMessages, message, slug))
    } else {
      const anthropicMessages: Anthropic.MessageParam[] = [
        ...prevMessages,
        { role: 'user', content: message },
      ]
      ;({ responseText, messages } = await runAnthropicLoop(systemPrompt, anthropicMessages, slug))
    }

    const result: ChatResponse = { response: responseText, messages }
    return Response.json(result)
  } catch (err) {
    console.error(`[chat/${slug}] Error (provider: ${PROVIDER}):`, err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
