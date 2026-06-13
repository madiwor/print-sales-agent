export const dynamic = 'force-dynamic'

export default function PortalAdminDashboard({ params }: { params: { slug: string } }) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-400 text-sm">Próximamente — issue #38 y #46.</p>
    </div>
  )
}
