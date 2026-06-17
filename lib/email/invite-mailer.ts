import Mailgun from 'mailgun.js'
import FormData from 'form-data'

const mailgun = new Mailgun(FormData)

function getClient() {
  const apiKey = process.env.MAILGUN_API_KEY
  if (!apiKey) return null
  return mailgun.client({ username: 'api', key: apiKey })
}

function buildInviteHtml(companyName: string, inviteLink: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">

    <!-- Header -->
    <div style="background:#1d4ed8;padding:28px 32px">
      <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px">
        madiwor<span style="color:#93c5fd">/agents</span>
      </span>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;line-height:1.3">
        Tu acceso al panel de ${companyName} está listo
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6">
        Fuiste invitado como administrador del portal de ventas de <strong style="color:#111827">${companyName}</strong>.
        Desde el panel podés ver las solicitudes de cotización, sesiones de clientes y configurar el agente.
      </p>

      <a href="${inviteLink}"
         style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px">
        Activar mi cuenta
      </a>

      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.6">
        Este link es válido por 24 horas. Si no esperabas este email, podés ignorarlo.
      </p>

      <hr style="margin:24px 0;border:none;border-top:1px solid #f3f4f6">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        ¿Problemas? Respondé este email o escribinos a
        <a href="mailto:hola@madiwor.com" style="color:#1d4ed8;text-decoration:none">hola@madiwor.com</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f3f4f6">
      <p style="margin:0;font-size:11px;color:#d1d5db;text-align:center">
        © ${new Date().getFullYear()} Madiwor · ai.madiwor.com
      </p>
    </div>

  </div>
</body>
</html>`
}

export async function sendInviteEmail(
  toEmail: string,
  companyName: string,
  inviteLink: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getClient()
  if (!client) {
    console.log('[invite-mailer] MAILGUN_API_KEY not set — skipping send')
    console.log('[invite-mailer] invite link:', inviteLink)
    return { ok: true }
  }

  const domain = process.env.MAILGUN_DOMAIN ?? 'mail.ai.madiwor.com'

  try {
    await client.messages.create(domain, {
      from:    `Madiwor <noreply@${domain}>`,
      to:      toEmail,
      subject: `Tu acceso al panel de ${companyName} está listo`,
      html:    buildInviteHtml(companyName, inviteLink),
    })
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[invite-mailer] send error:', msg)
    return { ok: false, error: msg }
  }
}
