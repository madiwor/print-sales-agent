import Link from 'next/link'

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-sm">
      <aside className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-200">
          <span className="text-xs text-gray-400 uppercase tracking-widest">Madiwor</span>
          <div className="font-semibold text-gray-900 mt-0.5">Superadmin</div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          <Link href="/superadmin" className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700">Dashboard</Link>
          <Link href="/superadmin/portales" className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700">Portales</Link>
          <Link href="/superadmin/rfqs" className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700">RFQs</Link>
          <Link href="/superadmin/sessions" className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700">Sesiones</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
