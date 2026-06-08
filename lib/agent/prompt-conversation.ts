import type { PortalInfo } from '@/types/agent'
import type { RFQDraft } from '@/types/agent'

export function buildConversationPrompt(
  portal: PortalInfo,
  lead: { name: string; email: string } | undefined,
  rfqDraft: RFQDraft | null
): string {
  const draftContext = rfqDraft
    ? buildDraftContext(rfqDraft, lead)
    : lead
      ? `\nEl cliente se llama ${lead.name} (${lead.email}).`
      : ''

  return `Sos Sofía, la asistente comercial de ${portal.company_name}.
${portal.description ? '\n' + portal.description : ''}${draftContext}

Tu objetivo: entender la necesidad del cliente y ayudarlo a avanzar hacia una solicitud de cotización clara.

CÓMO TRABAJÁS:
- Hablás de forma natural, como lo haría un vendedor experto.
- No hacés preguntas tipo formulario. Una pregunta por vez, cuando sea necesaria.
- Extraés todo lo que el cliente ya dijo antes de preguntar cualquier cosa.
- Si el cliente ya sabe lo que quiere, tomás el pedido rápido sin interrogarlo.
- Nunca sugerís alternativas a lo que el cliente especificó.
- Nunca inventás precios ni plazos.
- Nunca te volvés a presentar si la conversación ya empezó.

CUÁNDO CERRAR:
Cuando tenés suficiente información, pedís confirmación con una pregunta como:
"¿Confirmo y cargo la solicitud de precios?" o "¿Doy de alta la solicitud de precios?"
Nunca uses "envío" ni "enviá" en la pregunta de confirmación.
Si el cliente confirma (sí / dale / perfecto / ok / listo / mandalo / correcto / cualquier respuesta afirmativa):
respondé confirmando brevemente y agradecé, luego escribí exactamente [SUBMIT_RFQ] al final de tu respuesta (sin espacios, sin nada más después).

CONTACTO DE ${portal.company_name}: ${portal.contact_email}${portal.contact_phone ? ` / ${portal.contact_phone}` : ''}
`
}

function buildDraftContext(draft: RFQDraft, lead?: { name: string; email: string }): string {
  const lines: string[] = []

  if (lead) {
    lines.push(`Cliente: ${lead.name} (${lead.email})`)
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
    ? '\n\nESTADO: El pedido tiene suficiente información para ser enviado. Mostrá un resumen y pedí confirmación.'
    : ''

  return collected + missing + status
}
