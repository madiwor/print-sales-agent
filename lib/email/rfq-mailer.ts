import Mailgun from 'mailgun.js'
import FormData from 'form-data'
import type { RFQDraft, PortalInfo } from '@/types/agent'

const mailgun = new Mailgun(FormData)

function getClient() {
  const apiKey = process.env.MAILGUN_API_KEY
  if (!apiKey) return null
  return mailgun.client({ username: 'api', key: apiKey })
}

function buildEmailHtml(
  rfq: RFQDraft,
  lead: { name: string; email: string; company?: string },
  portal: PortalInfo,
  rfqUrl: string,
): string {
  const row = (label: string, value: string | number | null | undefined) =>
    value != null && value !== ''
      ? `<tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;white-space:nowrap">${label}</td><td style="padding:6px 12px;font-size:13px;color:#111827">${value}</td></tr>`
      : ''

  const medidas = rfq.width_mm && rfq.height_mm ? `${rfq.width_mm}×${rfq.height_mm} mm` : null

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:#1e40af;padding:20px 24px">
      <p style="margin:0;color:#93c5fd;font-size:12px;text-transform:uppercase;letter-spacing:.08em">${portal.company_name}</p>
      <h1 style="margin:4px 0 0;color:#fff;font-size:20px;font-weight:600">Nueva solicitud de cotización</h1>
    </div>
    <div style="padding:24px">
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <tbody>
          ${row('Nombre',      lead.name)}
          ${row('Email',       lead.email)}
          ${row('Empresa',     rfq.company_name ?? lead.company)}
          ${row('Teléfono',    rfq.contact_phone)}
          ${row('Producto',    rfq.product)}
          ${row('Cantidad',    rfq.quantity)}
          ${row('Material',    rfq.material)}
          ${row('Medidas',     medidas)}
          ${row('Colores',     rfq.colors)}
          ${row('Acabado',     rfq.finish)}
          ${row('Entrega',     rfq.delivery_format)}
          ${row('Troquel',     rfq.die_cut)}
          ${row('Arte',        rfq.has_artwork != null ? (rfq.has_artwork ? 'Sí' : 'No') : null)}
          ${row('Requerimientos', rfq.special_requirements)}
          ${row('Fecha límite', rfq.deadline)}
        </tbody>
      </table>
      ${rfqUrl ? `<div style="margin-top:20px"><a href="${rfqUrl}" style="display:inline-block;padding:10px 20px;background:#1e40af;color:#fff;border-radius:6px;text-decoration:none;font-size:14px">Ver RFQ en el panel →</a></div>` : ''}
    </div>
    <div style="padding:12px 24px;border-top:1px solid #e5e7eb;background:#f9fafb">
      <p style="margin:0;font-size:12px;color:#9ca3af">Enviado por el agente cotizador de ${portal.company_name} · Madiwor</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendRFQEmail(
  rfq: RFQDraft,
  lead: { name: string; email: string; company?: string },
  portal: PortalInfo,
  converterSlug: string,
  rfqId?: string | null,
): Promise<boolean> {
  const client = getClient()
  const domain = process.env.MAILGUN_DOMAIN

  if (!client || !domain) {
    console.log('\n=== RFQ ENVIADA (Mailgun no configurado) ===')
    console.log(JSON.stringify({ lead, rfq }, null, 2))
    console.log('===========================================\n')
    return true
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const rfqUrl = rfqId ? `${base}/portal/${converterSlug}/admin/rfqs/${rfqId}` : ''

  try {
    await client.messages.create(domain, {
      from:    `Cotizador <rfq@${domain}>`,
      to:      [portal.contact_email],
      subject: `Nueva cotización de ${lead.name} — ${portal.company_name}`,
      html:    buildEmailHtml(rfq, lead, portal, rfqUrl),
    })
    console.log('[Mailgun] Email enviado a:', portal.contact_email)
    return true
  } catch (err) {
    console.error('[Mailgun] Error:', err)
    return false
  }
}
