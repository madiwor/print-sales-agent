import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPortalDetail } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function PortalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const portal = await getPortalDetail(slug)
  if (!portal) notFound()

  const fields: [string, string | null | undefined][] = [
    ['Slug',         portal.slug],
    ['Empresa',      portal.company_name],
    ['Email',        portal.contact_email],
    ['Teléfono',     portal.contact_phone],
    ['Descripción',  portal.description],
    ['Estado',       portal.status === 'active' ? 'Activo' : 'Inactivo'],
    ['Creado',       new Date(portal.created_at).toLocaleString('es-AR')],
  ]

  return (
    <div className="max-w-2xl">
      <div className="mb-1 text-xs text-gray-400">Portal</div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">{portal.company_name}</h1>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
        {fields.filter(([, v]) => v != null && v !== '').map(([label, value]) => (
          <div key={label} className="flex px-4 py-3">
            <span className="w-36 shrink-0 text-xs text-gray-500 font-medium uppercase tracking-wide pt-0.5">{label}</span>
            <span className="text-sm text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      {portal.products_knowledge && (
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Conocimiento de productos</p>
          <pre className="bg-white border border-gray-200 rounded-lg p-4 text-xs text-gray-700 whitespace-pre-wrap">{portal.products_knowledge}</pre>
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/${portal.slug}/cotizar`} target="_blank" className="text-sm text-blue-600 hover:underline">
          Abrir agente →
        </Link>
        <Link href="/superadmin/portales" className="text-sm text-gray-500 hover:underline">
          ← Todos los portales
        </Link>
      </div>
    </div>
  )
}
