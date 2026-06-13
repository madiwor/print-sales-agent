import { getMetrics } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function SuperadminDashboard() {
  const m = await getMetrics()

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        <Stat label="RFQs hoy"     value={m.rfqs_today} />
        <Stat label="RFQs 7 días"  value={m.rfqs_week} />
        <Stat label="RFQs 30 días" value={m.rfqs_month} />
        <Stat label="Conversión"   value={`${m.conversion_rate}%`} sub={`${m.sessions_week} sesiones`} />
      </div>

      <h2 className="text-base font-medium text-gray-800 mb-3">Consumo de tokens — últimos 30 días</h2>
      {m.token_rows.length === 0 ? (
        <p className="text-gray-400">Sin datos aún.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <Th>Portal</Th><Th>Requests</Th><Th>Input</Th><Th>Output</Th><Th>Cache read</Th><Th>Costo est.</Th>
              </tr>
            </thead>
            <tbody>
              {m.token_rows.map(r => (
                <tr key={r.company_name} className="border-b border-gray-100 hover:bg-gray-50">
                  <Td>{r.company_name}</Td>
                  <Td>{r.request_count.toLocaleString()}</Td>
                  <Td>{(r.input_tokens / 1000).toFixed(1)}k</Td>
                  <Td>{(r.output_tokens / 1000).toFixed(1)}k</Td>
                  <Td>{(r.cache_read_tokens / 1000).toFixed(1)}k</Td>
                  <Td className="font-medium">${r.estimated_cost_usd.toFixed(4)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="pb-2 pr-6 text-xs font-medium uppercase tracking-wide">{children}</th>
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-2 pr-6 text-gray-700 ${className}`}>{children}</td>
}
