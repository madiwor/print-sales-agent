import Link from 'next/link'
import { LogoutButton } from './_components/LogoutButton'

export default async function PortalAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return (
    <div className="flex min-h-screen bg-gray-50 text-sm">
      <aside className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-200">
          <span className="text-xs text-gray-400 uppercase tracking-widest">{slug}</span>
          <div className="font-semibold text-gray-900 mt-0.5">Panel</div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          <Link href={`/portal/${slug}/admin`}          className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700">Dashboard</Link>
          <Link href={`/portal/${slug}/admin/rfqs`}     className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700">RFQs</Link>
          <Link href={`/portal/${slug}/admin/sessions`} className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700">Sesiones</Link>
          <Link href={`/portal/${slug}/admin/embed`}    className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700">Integrar</Link>
        </nav>
        <LogoutButton />
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
