import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPortalUser } from '@/lib/supabase/portal-auth'
import { listPortalSessions } from '@/lib/supabase/portal-admin'

export const dynamic = 'force-dynamic'

export default async function PortalSessionsPage({
  params,
  searchParams,
}: {
  params:       Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const user = await getPortalUser()
  if (!user || user.converter_slug !== slug) notFound()

  const sp   = await searchParams
  const page = Math.max(0, parseInt(sp.page ?? '0', 10))
  const { rows, total } = await listPortalSessions(slug, page)
  const totalPages = Math.ceil(total / 25)

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Sesiones <span className="text-gray-400 font-normal text-base">({total})</span></h1>

      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <Th>Fecha</Th><Th>Email</Th><Th>Turnos</Th><Th>RFQ</Th><Th />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <Td>{new Date(r.created_at).toLocaleDateString('es-AR')}</Td>
                <Td>{r.contact_email}</Td>
                <Td>{r.turn_count}</Td>
                <Td>
                  {r.rfq_id
                    ? <Link href={`/portal/${slug}/admin/rfqs/${r.rfq_id}`} className="text-blue-600 hover:underline text-xs">Ver RFQ</Link>
                    : <span className="text-gray-300">—</span>
                  }
                </Td>
                <Td><Link href={`/portal/${slug}/admin/sessions/${r.id}`} className="text-blue-600 hover:underline">Ver</Link></Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">Sin sesiones aún.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 justify-end">
          {page > 0 && <Link href={`/portal/${slug}/admin/sessions?page=${page-1}`} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">← Anterior</Link>}
          <span className="px-3 py-1 text-sm text-gray-500">{page+1} / {totalPages}</span>
          {page < totalPages-1 && <Link href={`/portal/${slug}/admin/sessions?page=${page+1}`} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">Siguiente →</Link>}
        </div>
      )}
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">{children}</th>
}
function Td({ children }: { children?: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm text-gray-700">{children}</td>
}
