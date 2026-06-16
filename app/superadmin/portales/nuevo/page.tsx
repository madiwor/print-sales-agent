'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NuevoPortalPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const body = {
      slug:               form.get('slug'),
      company_name:       form.get('company_name'),
      contact_email:      form.get('contact_email'),
      contact_phone:      form.get('contact_phone') || null,
      description:        form.get('description') || null,
      products_knowledge: form.get('products_knowledge') || null,
      status:             form.get('status'),
    }

    const res = await fetch('/superadmin/api/portales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const { slug } = await res.json()
      router.push(`/superadmin/portales/${slug}`)
    } else {
      const { error: msg } = await res.json().catch(() => ({ error: 'Error desconocido' }))
      setError(msg ?? 'Error al crear el portal')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Nuevo portal</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Slug" hint="Solo letras minúsculas, números y guiones. Ejemplo: nyssa">
          <input name="slug" required pattern="[a-z0-9-]+" className={input} placeholder="nyssa" />
        </Field>

        <Field label="Nombre de empresa">
          <input name="company_name" required className={input} placeholder="Nyssa Etiquetas" />
        </Field>

        <Field label="Email de contacto" hint="Aquí se enviarán las RFQs">
          <input name="contact_email" required type="email" className={input} placeholder="cotizaciones@nyssa.com.ar" />
        </Field>

        <Field label="Teléfono (opcional)">
          <input name="contact_phone" className={input} placeholder="+54 11 1234-5678" />
        </Field>

        <Field label="Descripción">
          <textarea name="description" rows={3} className={input} placeholder="Fabricante de etiquetas autoadhesivas..." />
        </Field>

        <Field label="Conocimiento de productos" hint="Se inyecta en el prompt del agente">
          <textarea name="products_knowledge" rows={5} className={input} placeholder="Catálogo de materiales, especificaciones técnicas..." />
        </Field>

        <Field label="Estado">
          <select name="status" defaultValue="active" className={input}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="self-start px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40"
        >
          {saving ? 'Creando…' : 'Crear portal'}
        </button>
      </form>
    </div>
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
