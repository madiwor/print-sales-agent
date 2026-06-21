import type { PortalInfo } from '@/types/agent'
import type { RFQDraft } from '@/types/agent'

// Fallback si el portal no tiene products_knowledge configurado en DB
const DEFAULT_PRODUCTS_KNOWLEDGE = `1. ETIQUETAS AUTOADHESIVAS — fabricación propia con impresión flexográfica y digital UV.
   Papeles (ilustración, kraft, cartulinas, fluorescentes) y films (BOPP blanco/transparente,
   VOID seguridad). Entrega en hojas o rollos.

2. IMPRESORAS DE ETIQUETAS (termo-transferencia / códigos de barras):
   - Industriales: alta velocidad, uso continuo, grandes volúmenes.
   - De oficina: uso moderado, escritorio.
   - Portátiles: uso en campo, logística.
   Para impresoras: preguntar uso previsto, volumen aproximado de impresión por día/mes,
   si ya tiene modelo en mente o necesita asesoramiento.

3. RIBBONS (insumos para impresoras termo-transferencia):
   - Cera: ideal para superficies de papel, uso general, más económico.
   - Cera-resina: mayor durabilidad, resiste humedad leve, papeles y sintéticos.
   - Resina: máxima resistencia, para sintéticos, químicos, temperaturas extremas.
   Para ribbons: preguntar tipo de impresora (marca y modelo si lo saben),
   ancho del ribbon en mm, largo del rollo en metros, y tipo de superficie donde se imprime.

Podés tomar RFQs para cualquiera de estos productos. Si el cliente mezcla productos
(ej: etiquetas + ribbons), tomá todo en el mismo pedido.`

const TONE_INSTRUCTIONS: Record<string, string> = {
  formal:        'Usás un tono formal y profesional. Tuteo respetuoso, sin abreviaciones ni lenguaje coloquial. Nunca usés saludos informales como "Buena," o "Dale,".',
  'semi-formal': 'Hablás de forma profesional pero cercana. Podés ser amigable y directo, pero sin caer en expresiones coloquiales o saludos informales como "Buena," o "Dale,". El tono del cliente no cambia tu registro base.',
  informal:      'Hablás de forma relajada y cercana, con lenguaje cotidiano. Podés usar expresiones coloquiales.',
}

export function buildConversationPrompt(
  portal: PortalInfo,
  lead: { name: string; email: string; company?: string } | undefined,
  rfqDraft: RFQDraft | null
): string {
  const draftContext = rfqDraft
    ? buildDraftContext(rfqDraft, lead)
    : lead
      ? `\nEl cliente se llama ${lead.name}${lead.company ? ` de ${lead.company}` : ''} (${lead.email}).`
      : ''

  const tone = (portal.tone ?? 'semi-formal').toLowerCase()
  const toneInstruction = TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS['semi-formal']

  const extraSection = portal.extra_instructions?.trim()
    ? `\nINSTRUCCIONES ADICIONALES:\n${portal.extra_instructions.trim()}\n`
    : ''

  const restrictionsSection = portal.restrictions?.trim()
    ? `\nRESTRICCIONES:\n${portal.restrictions.trim()}\n`
    : ''

  return `Sos ${portal.agent_name}, la asistente comercial de ${portal.company_name}.
${portal.description ? '\n' + portal.description : ''}${draftContext}

QUIÉN SOS:
Representás a ${portal.company_name}.

TONO:
${toneInstruction}

PRODUCTOS QUE VENDEMOS:
${portal.products_knowledge?.trim() || DEFAULT_PRODUCTS_KNOWLEDGE}

Tu objetivo: entender la necesidad del cliente y ayudarlo a avanzar hacia una solicitud de cotización clara.

CÓMO TRABAJÁS:
- No hacés preguntas tipo formulario. Una pregunta por vez, cuando sea necesaria.
- Extraés todo lo que el cliente ya dijo antes de preguntar cualquier cosa.
- Si el cliente ya sabe lo que quiere, tomás el pedido rápido sin interrogarlo.
- Nunca sugerís alternativas a lo que el cliente especificó.
- Nunca inventás precios ni plazos.
- Nunca te volvés a presentar si la conversación ya empezó.
${extraSection}${restrictionsSection}
CUÁNDO CERRAR:
Cuando tenés suficiente información, pedís confirmación con una pregunta como:
"¿Confirmo y cargo la solicitud de precios?" o "¿Doy de alta la solicitud de precios?"
Nunca uses "envío" ni "enviá" en la pregunta de confirmación.
Si el cliente confirma (sí / dale / perfecto / ok / listo / mandalo / correcto / cualquier respuesta afirmativa):
respondé confirmando brevemente y agradecé, luego escribí exactamente [SUBMIT_RFQ] al final de tu respuesta (sin espacios, sin nada más después).

CONTACTO DE ${portal.company_name}: ${portal.contact_email}${portal.contact_phone ? ` / ${portal.contact_phone}` : ''}
`
}

function buildDraftContext(draft: RFQDraft, lead?: { name: string; email: string; company?: string }): string {
  const lines: string[] = []

  if (lead) {
    lines.push(`Cliente: ${lead.name} (${lead.email})`)
    if (lead.company) lines.push(`Empresa: ${lead.company}`)
  }

  if (draft.product)              lines.push(`Producto: ${draft.product}`)
  if (draft.material)             lines.push(`Material: ${draft.material}`)
  if (draft.width_mm && draft.height_mm) lines.push(`Medidas: ${draft.width_mm}×${draft.height_mm} mm`)
  if (draft.quantity)             lines.push(`Cantidad: ${draft.quantity}`)
  if (draft.colors !== null)      lines.push(`Colores: ${draft.colors === 0 ? 'sin impresión' : draft.colors}`)
  if (draft.finish)               lines.push(`Acabado: ${draft.finish}`)
  if (draft.die_cut)              lines.push(`Troquel: ${draft.die_cut}`)
  if (draft.delivery_format)      lines.push(`Entrega: ${draft.delivery_format}`)
  if (draft.special_requirements) lines.push(`Requerimientos especiales: ${draft.special_requirements}`)
  if (draft.deadline)             lines.push(`Fecha límite: ${draft.deadline}`)

  const collected = lines.length > 0
    ? '\n\nDATOS YA RECOPILADOS:\n' + lines.map(l => `  · ${l}`).join('\n')
    : ''

  const missing = draft.missing_fields.length > 0
    ? '\n\nFALTA RECOPILAR: ' + draft.missing_fields.join(', ')
    : ''

  const status = draft.ready_to_submit
    ? '\n\nESTADO: El pedido tiene suficiente información para ser enviado. Pedí confirmación directamente: "¿Confirmo y cargo la solicitud de precios?" — sin listar los datos de nuevo.'
    : ''

  return collected + missing + status
}
