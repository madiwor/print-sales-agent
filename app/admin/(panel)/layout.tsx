import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-sm">
      <aside className="w-48 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-200">
          <span className="font-semibold text-gray-900">Admin</span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          <Link href="/admin" className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700">Dashboard</Link>
          <Link href="/admin/rfqs" className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700">RFQs</Link>
          <Link href="/admin/sessions" className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700">Sesiones</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
