import { getMetrics } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function SuperadminDashboard() {
  const m = await getMetrics()

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        <StatCard label="RFQs hoy"     value={m.rfqs_today}          icon="📥" />
        <StatCard label="RFQs 7 días"  value={m.rfqs_week}           icon="📊" />
        <StatCard label="RFQs 30 días" value={m.rfqs_month}          icon="📈" />
        <StatCard label="Conversión"   value={`${m.conversion_rate}%`} icon="🎯" sub={`${m.sessions_week} sesiones`} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-800">Consumo de tokens — últimos 30 días</h2>
        </div>
        {m.token_rows.length === 0 ? (
          <p className="px-5 py-8 text-gray-400 text-sm">Sin datos aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <Th>Portal</Th><Th>Requests</Th><Th>Input</Th><Th>Output</Th><Th>Cache read</Th><Th>Costo est.</Th>
                </tr>
              </thead>
              <tbody>
                {m.token_rows.map(r => (
                  <tr key={r.company_name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <Td className="font-medium text-gray-900">{r.company_name}</Td>
                    <Td>{r.request_count.toLocaleString()}</Td>
                    <Td>{(r.input_tokens / 1000).toFixed(1)}k</Td>
                    <Td>{(r.output_tokens / 1000).toFixed(1)}k</Td>
                    <Td>{(r.cache_read_tokens / 1000).toFixed(1)}k</Td>
                    <Td className="font-semibold text-gray-900">${r.estimated_cost_usd.toFixed(4)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide">{children}</th>
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3 text-sm text-gray-600 ${className}`}>{children}</td>
}
