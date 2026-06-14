import Link from 'next/link'
import { listPortales } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function PortalesPage() {
  const portales = await listPortales()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Portales <span className="text-gray-400 font-normal text-base">({portales.length})</span>
        </h1>
        <Link href="/superadmin/portales/nuevo" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          + Nuevo portal
        </Link>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <Th>Empresa</Th><Th>Slug</Th><Th>Email</Th><Th>Estado</Th><Th>Creado</Th><Th></Th>
            </tr>
          </thead>
          <tbody>
            {portales.map(p => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <Td>{p.company_name}</Td>
                <Td><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.slug}</code></Td>
                <Td>{p.contact_email}</Td>
                <Td>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </Td>
                <Td>{new Date(p.created_at).toLocaleDateString('es-AR')}</Td>
                <Td>
                  <Link href={`/superadmin/portales/${p.slug}`} className="text-blue-600 hover:underline">Ver</Link>
                </Td>
              </tr>
            ))}
            {portales.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">Sin portales aún.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">{children}</th>
}
function Td({ children }: { children?: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm text-gray-700">{children}</td>
}
