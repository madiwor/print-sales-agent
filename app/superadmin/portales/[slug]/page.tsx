import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPortalDetail } from '@/lib/supabase/admin'
import { UsuariosPanel } from './_components/UsuariosPanel'

export const dynamic = 'force-dynamic'

export default async function PortalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const portal = await getPortalDetail(slug)
  if (!portal) notFound()

  const TONE_LABEL: Record<string, string> = {
    formal: 'Formal',
    'semi-formal': 'Semi-formal',
    informal: 'Informal',
  }

  const mainFields: [string, string | null | undefined][] = [
    ['Slug',        portal.slug],
    ['Empresa',     portal.company_name],
    ['Email',       portal.contact_email],
    ['Teléfono',    portal.contact_phone],
    ['Descripción', portal.description],
    ['Estado',      portal.status === 'active' ? 'Activo' : 'Inactivo'],
    ['Creado',      new Date(portal.created_at).toLocaleString('es-AR')],
  ]

  const configFields: [string, string | null | undefined][] = [
    ['Cant. mínima',    portal.min_quantity   != null ? String(portal.min_quantity)   : null],
    ['Ancho máx. (mm)', portal.max_width_mm   != null ? String(portal.max_width_mm)   : null],
    ['Colores máx.',    portal.max_colors     != null ? String(portal.max_colors)     : null],
    ['Entrega (días)',  portal.lead_time_days != null ? String(portal.lead_time_days) : null],
  ]

  const agentFields: [string, string | null | undefined][] = [
    ['Tono',         portal.tone ? (TONE_LABEL[portal.tone] ?? portal.tone) : null],
    ['Webhook URL',  portal.webhook_url],
  ]

  function FieldTable({ rows }: { rows: [string, string | null | undefined][] }) {
    const visible = rows.filter(([, v]) => v != null && v !== '')
    if (!visible.length) return null
    return (
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {visible.map(([label, value]) => (
          <div key={label} className="flex px-4 py-3">
            <span className="w-40 shrink-0 text-xs text-gray-500 font-medium uppercase tracking-wide pt-0.5">{label}</span>
            <span className="text-sm text-gray-900 break-all">{value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-1 text-xs text-gray-400">Portal</div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">{portal.company_name}</h1>

      <div className="mb-6"><FieldTable rows={mainFields} /></div>

      {configFields.some(([, v]) => v != null) && (
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Capacidades técnicas</p>
          <FieldTable rows={configFields} />
        </div>
      )}

      {agentFields.some(([, v]) => v != null) && (
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Comportamiento del agente</p>
          <FieldTable rows={agentFields} />
        </div>
      )}

      {portal.products_knowledge && (
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Conocimiento de productos</p>
          <pre className="bg-white border border-gray-200 rounded-lg p-4 text-xs text-gray-700 whitespace-pre-wrap">{portal.products_knowledge}</pre>
        </div>
      )}

      {portal.extra_instructions && (
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Instrucciones adicionales</p>
          <pre className="bg-white border border-gray-200 rounded-lg p-4 text-xs text-gray-700 whitespace-pre-wrap">{portal.extra_instructions}</pre>
        </div>
      )}

      {portal.restrictions && (
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Restricciones</p>
          <pre className="bg-white border border-gray-200 rounded-lg p-4 text-xs text-gray-700 whitespace-pre-wrap">{portal.restrictions}</pre>
        </div>
      )}

      <div className="mb-8">
        <UsuariosPanel slug={slug} />
      </div>

      <div className="flex gap-4">
        <Link href={`/superadmin/portales/${portal.slug}/editar`} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          Editar portal
        </Link>
        <Link href={`/${portal.slug}/cotizar`} target="_blank" className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 text-gray-700">
          Abrir agente →
        </Link>
        <Link href="/superadmin/portales" className="text-sm text-gray-500 self-center hover:underline">
          ← Volver
        </Link>
      </div>
    </div>
  )
}
