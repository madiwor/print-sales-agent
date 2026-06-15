import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPortalDetail, getPortalConfig } from '@/lib/supabase/admin'
import { EditPortalForm } from './EditPortalForm'

export const dynamic = 'force-dynamic'

export default async function EditPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [portal, config] = await Promise.all([getPortalDetail(slug), getPortalConfig(slug)])
  if (!portal) notFound()

  return (
    <div className="max-w-xl">
      <div className="mb-1 text-xs text-gray-400">
        <Link href="/superadmin/portales" className="hover:underline">Portales</Link>
        {' / '}
        <Link href={`/superadmin/portales/${slug}`} className="hover:underline">{portal.company_name}</Link>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Editar portal</h1>

      <EditPortalForm
        slug={slug}
        initial={{
          company_name:       portal.company_name,
          contact_email:      portal.contact_email,
          contact_phone:      portal.contact_phone ?? '',
          description:        portal.description ?? '',
          products_knowledge: portal.products_knowledge ?? '',
          status:             portal.status,
          min_quantity:       String(config?.min_quantity ?? 0),
          max_width_mm:       String(config?.max_width_mm ?? 320),
          max_colors:         String(config?.max_colors ?? 8),
          lead_time_days:     String(config?.lead_time_days ?? 10),
        }}
      />
    </div>
  )
}
