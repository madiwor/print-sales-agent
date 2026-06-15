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

const STATUS_STYLES: Record<string, string> = {
  submitted:   'bg-blue-50 text-blue-700',
  in_progress: 'bg-yellow-50 text-yellow-700',
  quoted:      'bg-purple-50 text-purple-700',
  closed:      'bg-gray-100 text-gray-500',
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
        <StatCard label="RFQs hoy"     value={m.rfqs_today}           icon="📥" />
        <StatCard label="RFQs 7 días"  value={m.rfqs_week}            icon="📊" />
        <StatCard label="RFQs 30 días" value={m.rfqs_month}           icon="📈" />
        <StatCard label="Conversión"   value={`${m.conversion_rate}%`} icon="🎯" sub={`${m.sessions_week} sesiones`} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-800">Últimas solicitudes</h2>
          <Link href={`/portal/${slug}/admin/rfqs`} className="text-sm text-blue-600 hover:underline">Ver todas →</Link>
        </div>

        {m.recent_rfqs.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400">Sin solicitudes aún.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {m.recent_rfqs.map(r => (
              <Link
                key={r.id}
                href={`/portal/${slug}/admin/rfqs/${r.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">{r.contact_name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {(r.specs as any).product ?? '—'} · {new Date(r.created_at).toLocaleDateString('es-AR')}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {STATUS_LABELS[r.status] ?? r.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">{label}</p>
        <span className="text-base">{icon}</span>
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
