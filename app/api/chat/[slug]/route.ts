import Anthropic from '@anthropic-ai/sdk'
import type { NextRequest } from 'next/server'
import { buildSystemPrompt } from '@/lib/agent/prompt'
import { CLIENT_TOOLS } from '@/lib/agent/client-tools'
import { handleTool } from '@/lib/agent/tool-handlers'
import type { ChatRequest, ChatResponse, PortalInfo } from '@/types/agent'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 1000
const MAX_TOOL_ITERATIONS = 10

async function getPortalInfo(slug: string): Promise<PortalInfo> {
  const result = await handleTool('get_portal_info', {}, { converterSlug: slug })
  return result as PortalInfo
}

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

  const { message, messages: prevMessages = [] } = body

  if (!message?.trim()) {
    return Response.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
  }

  let portalInfo: PortalInfo
  try {
    portalInfo = await getPortalInfo(slug)
  } catch {
    return Response.json({ error: 'Portal no encontrado' }, { status: 404 })
  }

  const systemPrompt = buildSystemPrompt(portalInfo, 'rfq')

  const messages: Anthropic.MessageParam[] = [
    ...prevMessages,
    { role: 'user', content: message },
  ]

  try {
    let iterations = 0
    let response: Anthropic.Message

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++

      response = await anthropic.messages.create({
        model:   MODEL,
        max_tokens: MAX_TOKENS,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages,
        tools:   CLIENT_TOOLS,
      })

      if (response.stop_reason !== 'tool_use') {
        break
      }

      // Append assistant message with tool_use blocks
      messages.push({ role: 'assistant', content: response.content })

      // Execute all tool_use blocks and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        let toolResult: unknown
        try {
          toolResult = await handleTool(
            block.name,
            block.input as Record<string, unknown>,
            { converterSlug: slug }
          )
        } catch (err) {
          toolResult = { error: err instanceof Error ? err.message : 'Error desconocido' }
        }

        toolResults.push({
          type:        'tool_result',
          tool_use_id: block.id,
          content:     JSON.stringify(toolResult),
        })
      }

      messages.push({ role: 'user', content: toolResults })
    }

    // Extract text from final response
    const textBlock = response!.content.find(b => b.type === 'text')
    const responseText = textBlock && textBlock.type === 'text'
      ? textBlock.text
      : 'No pude generar una respuesta. Por favor intentá de nuevo.'

    const result: ChatResponse = {
      response: responseText,
      messages,
    }

    return Response.json(result)
  } catch (err) {
    console.error('[chat/[slug]] Error llamando a Claude API:', err)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
