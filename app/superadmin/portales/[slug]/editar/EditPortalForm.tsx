'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PortalFormData {
  company_name:        string
  contact_email:       string
  contact_phone:       string
  description:         string
  products_knowledge:  string
  status:              string
  min_quantity:        string
  max_width_mm:        string
  max_colors:          string
  lead_time_days:      string
  tone:                string
  extra_instructions:  string
  restrictions:        string
  webhook_url:         string
}

export function EditPortalForm({ slug, initial }: { slug: string; initial: PortalFormData }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    const form = new FormData(e.currentTarget)
    const body = {
      company_name:       form.get('company_name'),
      contact_email:      form.get('contact_email'),
      contact_phone:      form.get('contact_phone') || null,
      description:        form.get('description') || null,
      products_knowledge:  form.get('products_knowledge') || null,
      status:              form.get('status'),
      min_quantity:        Number(form.get('min_quantity')),
      max_width_mm:        Number(form.get('max_width_mm')),
      max_colors:          Number(form.get('max_colors')),
      lead_time_days:      Number(form.get('lead_time_days')),
      tone:                form.get('tone'),
      extra_instructions:  form.get('extra_instructions') || null,
      restrictions:        form.get('restrictions') || null,
      webhook_url:         form.get('webhook_url') || null,
    }

    const res = await fetch(`/api/superadmin/portales/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    } else {
      const { error: msg } = await res.json().catch(() => ({ error: 'Error desconocido' }))
      setError(msg ?? 'Error al guardar')
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Nombre de empresa">
        <input name="company_name" required defaultValue={initial.company_name} className={input} />
      </Field>

      <Field label="Email de contacto" hint="Aquí se enviarán las RFQs">
        <input name="contact_email" required type="email" defaultValue={initial.contact_email} className={input} />
      </Field>

      <Field label="Teléfono (opcional)">
        <input name="contact_phone" defaultValue={initial.contact_phone} className={input} />
      </Field>

      <Field label="Descripción">
        <textarea name="description" rows={3} defaultValue={initial.description} className={input} />
      </Field>

      <Field label="Conocimiento de productos" hint="Se inyecta en el prompt del agente">
        <textarea name="products_knowledge" rows={6} defaultValue={initial.products_knowledge} className={input} />
      </Field>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Capacidades técnicas</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cantidad mínima">
            <input name="min_quantity" type="number" min={0} defaultValue={initial.min_quantity} className={input} />
          </Field>
          <Field label="Ancho máximo (mm)">
            <input name="max_width_mm" type="number" min={1} defaultValue={initial.max_width_mm} className={input} />
          </Field>
          <Field label="Colores máximos">
            <input name="max_colors" type="number" min={1} defaultValue={initial.max_colors} className={input} />
          </Field>
          <Field label="Tiempo de entrega (días)">
            <input name="lead_time_days" type="number" min={1} defaultValue={initial.lead_time_days} className={input} />
          </Field>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Comportamiento del agente</p>
        <div className="flex flex-col gap-4">
          <Field label="Tono">
            <select name="tone" defaultValue={initial.tone} className={input}>
              <option value="formal">Formal — profesional y respetuoso</option>
              <option value="semi-formal">Semi-formal — natural y directo (recomendado)</option>
              <option value="informal">Informal — relajado y cercano</option>
            </select>
          </Field>
          <Field label="Instrucciones adicionales" hint="Se inyectan en el prompt. Ej: 'Siempre mencioná el tiempo de entrega express disponible.'">
            <textarea name="extra_instructions" rows={4} defaultValue={initial.extra_instructions} className={input} placeholder="Instrucciones específicas para este portal..." />
          </Field>
          <Field label="Restricciones" hint="Ej: 'No cotizar menos de 500 unidades. No ofrecer envío internacional.'">
            <textarea name="restrictions" rows={3} defaultValue={initial.restrictions} className={input} placeholder="Restricciones o limitaciones del agente..." />
          </Field>
          <Field label="Webhook URL" hint="Se invoca con POST JSON al completarse cada RFQ. Ej: endpoint de HubSpot, Zoho, n8n.">
            <input name="webhook_url" type="url" defaultValue={initial.webhook_url} className={input} placeholder="https://hooks.ejemplo.com/rfq" />
          </Field>
        </div>
      </div>

      <Field label="Estado">
        <select name="status" defaultValue={initial.status} className={input}>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {saved && <span className="text-sm text-green-600">✓ Guardado</span>}
      </div>
    </form>
  )
}

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {children}
    </div>
  )
}
