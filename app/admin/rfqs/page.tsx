import Link from 'next/link'
import { listRFQs } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

const STATUS_LABELS: Record<string, string> = {
  submitted:   'Recibida',
  in_progress: 'En proceso',
  quoted:      'Cotizada',
  closed:      'Cerrada',
}

export default async function RFQsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const sp   = await searchParams
  const page = Math.max(0, parseInt(sp.page ?? '0', 10))
  const { rows, total } = await listRFQs({ page, pageSize: PAGE_SIZE, status: sp.status })
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">RFQs <span className="text-gray-400 font-normal text-base">({total})</span></h1>

      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <Th>Fecha</Th><Th>Contacto</Th><Th>Portal</Th><Th>Producto</Th><Th>Estado</Th><Th />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <Td>{new Date(r.created_at).toLocaleDateString('es-AR')}</Td>
                <Td>
                  <div className="font-medium text-gray-900">{r.contact_name}</div>
                  <div className="text-xs text-gray-400">{r.contact_email}</div>
                </Td>
                <Td>{r.converter.company_name}</Td>
                <Td>{(r.specs as any).product ?? '—'}</Td>
                <Td>
                  <StatusBadge status={r.status} />
                </Td>
                <Td>
                  <Link href={`/admin/rfqs/${r.id}`} className="text-blue-600 hover:underline">Ver</Link>
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">Sin RFQs aún.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 justify-end">
          {page > 0 && (
            <Link href={`/admin/rfqs?page=${page - 1}`} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">← Anterior</Link>
          )}
          <span className="px-3 py-1 text-sm text-gray-500">{page + 1} / {totalPages}</span>
          {page < totalPages - 1 && (
            <Link href={`/admin/rfqs?page=${page + 1}`} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">Siguiente →</Link>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    submitted:   'bg-blue-50 text-blue-700',
    in_progress: 'bg-yellow-50 text-yellow-700',
    quoted:      'bg-purple-50 text-purple-700',
    closed:      'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">{children}</th>
}
function Td({ children }: { children?: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm text-gray-700">{children}</td>
}
