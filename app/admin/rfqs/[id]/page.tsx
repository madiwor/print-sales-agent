import { notFound } from 'next/navigation'
import { getRFQ } from '@/lib/supabase/admin'
import { UpdateStatusForm } from './UpdateStatusForm'

export const dynamic = 'force-dynamic'

export default async function RFQDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rfq = await getRFQ(id)
  if (!rfq) notFound()

  const specs = rfq.specs as Record<string, unknown>

  const fields = [
    ['Producto',        specs.product],
    ['Cantidad',        specs.quantity],
    ['Material',        specs.material],
    ['Medidas',         specs.width_mm && specs.height_mm ? `${specs.width_mm}×${specs.height_mm} mm` : null],
    ['Colores',         specs.colors !== null && specs.colors !== undefined ? String(specs.colors) : null],
    ['Acabado',         specs.finish],
    ['Entrega',         specs.delivery_format],
    ['Troquel',         specs.die_cut],
    ['Tiene arte',      specs.has_artwork != null ? (specs.has_artwork ? 'Sí' : 'No') : null],
    ['Requerimientos',  specs.special_requirements],
    ['Fecha límite',    specs.deadline],
    ['Empresa',         rfq.contact_company],
    ['Teléfono',        specs.contact_phone],
  ].filter(([, v]) => v != null && v !== '') as [string, string][]

  return (
    <div className="max-w-2xl">
      <div className="mb-1 text-xs text-gray-400">{rfq.converter.company_name}</div>
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

      <UpdateStatusForm rfqId={rfq.id} currentStatus={rfq.status} />
    </div>
  )
}
