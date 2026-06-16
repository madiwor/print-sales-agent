import { notFound } from 'next/navigation'
import { getPortalUser } from '@/lib/supabase/portal-auth'
import { getPortalRFQ } from '@/lib/supabase/portal-admin'
import { UpdateStatusForm } from './UpdateStatusForm'

export const dynamic = 'force-dynamic'

export default async function PortalRFQDetail({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const user = await getPortalUser()
  if (!user || user.converter_slug !== slug) notFound()

  const rfq = await getPortalRFQ(slug, id)
  if (!rfq) notFound()

  const specs = rfq.specs as Record<string, unknown>

  const fields = [
    ['Producto',       specs.product],
    ['Cantidad',       specs.quantity],
    ['Material',       specs.material],
    ['Medidas',        specs.width_mm && specs.height_mm ? `${specs.width_mm}×${specs.height_mm} mm` : null],
    ['Colores',        specs.colors != null ? String(specs.colors) : null],
    ['Acabado',        specs.finish],
    ['Entrega',        specs.delivery_format],
    ['Troquel',        specs.die_cut],
    ['Tiene arte',     specs.has_artwork != null ? (specs.has_artwork ? 'Sí' : 'No') : null],
    ['Requerimientos', specs.special_requirements],
    ['Fecha límite',   specs.deadline],
    ['Empresa',        rfq.contact_company],
    ['Teléfono',       specs.contact_phone],
  ].filter(([, v]) => v != null && v !== '') as [string, string][]

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">{rfq.contact_name}</h1>
      <p className="text-sm text-gray-500 mb-6">{rfq.contact_email} · {new Date(rfq.created_at).toLocaleString('es-AR')}</p>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
        {fields.map(([label, value]) => (
          <div key={label} className="flex px-4 py-3">
            <span className="w-36 shrink-0 text-xs text-gray-500 font-medium uppercase tracking-wide pt-0.5">{label}</span>
            <span className="text-sm text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      <UpdateStatusForm rfqId={rfq.id} slug={slug} currentStatus={rfq.status} />
    </div>
  )
}
