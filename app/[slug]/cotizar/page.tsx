import { CotizarShell } from '@/components/chat/CotizarShell'
import { handleTool } from '@/lib/agent/tool-handlers'
import type { PortalInfo } from '@/types/agent'
import { notFound } from 'next/navigation'

const BRAND_CONFIG: Record<string, { accentColor: string; logo: React.ReactNode }> = {
  nyssa: {
    accentColor: '#E31E24',
    logo: (
      <div className="text-center">
        <div style={{ color: '#E31E24' }} className="text-4xl font-bold tracking-tight">Nyssa</div>
        <div className="text-sm text-neutral-500 font-medium">Etiquetas Autoadhesivas</div>
      </div>
    ),
  },
}

export default async function CotizarPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let portal: PortalInfo
  try {
    portal = await handleTool('get_portal_info', {}, { converterSlug: slug }) as PortalInfo
  } catch {
    notFound()
  }

  const greeting = portal.custom_greeting
    ?? `soy ${portal.agent_name} de ${portal.company_name}. ¿En qué te puedo ayudar?`

  const brand = BRAND_CONFIG[slug]

  return (
    <div className="flex flex-col h-[100dvh] bg-neutral-100 sm:items-center sm:justify-center">
      <div className="flex flex-col w-full h-full sm:h-[680px] sm:max-w-md sm:rounded-2xl sm:shadow-xl sm:overflow-hidden bg-white">
      <CotizarShell
        slug={slug}
        agentName={portal.agent_name}
        company={portal.company_name}
        greeting={greeting}
        accentColor={brand?.accentColor}
        logo={brand?.logo}
      />
      </div>
    </div>
  )
}
