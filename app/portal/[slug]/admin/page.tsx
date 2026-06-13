import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPortalUser } from '@/lib/supabase/portal-auth'
import { getPortalMetrics } from '@/lib/supabase/portal-admin'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  submitted:   'Recibida',
  in_progress: 'En proceso',
  quoted:      'Cotizada',
  closed:      'Cerrada',
}

export default async function PortalDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const user = await getPortalUser()
  if (!user || user.converter_slug !== slug) notFound()

  const m = await getPortalMetrics(slug)

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        <Stat label="RFQs hoy"    value={m.rfqs_today} />
        <Stat label="RFQs 7 días" value={m.rfqs_week} />
        <Stat label="RFQs 30 días" value={m.rfqs_month} />
        <Stat label="Conversión" value={`${m.conversion_rate}%`} sub={`${m.sessions_week} sesiones`} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-medium text-gray-800">Recientes</h2>
        <Link href={`/portal/${slug}/admin/rfqs`} className="text-sm text-blue-600 hover:underline">Ver todas →</Link>
      </div>

      {m.recent_rfqs.length === 0 ? (
        <p className="text-gray-400 text-sm">Sin solicitudes aún.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {m.recent_rfqs.map(r => (
            <Link
              key={r.id}
              href={`/portal/${slug}/admin/rfqs/${r.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">{r.contact_name}</div>
                <div className="text-xs text-gray-400">{(r.specs as any).product ?? '—'} · {new Date(r.created_at).toLocaleDateString('es-AR')}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                r.status === 'submitted'   ? 'bg-blue-50 text-blue-700' :
                r.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700' :
                r.status === 'quoted'      ? 'bg-purple-50 text-purple-700' :
                'bg-gray-100 text-gray-500'
              }`}>{STATUS_LABELS[r.status] ?? r.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
