import { ChatWindow } from '@/components/chat/ChatWindow'
import { handleTool } from '@/lib/agent/tool-handlers'
import type { PortalInfo } from '@/types/agent'
import { notFound } from 'next/navigation'

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

  return (
    <div className="flex flex-col h-screen bg-white">
      <ChatWindow
        slug={slug}
        agentName={portal.agent_name}
        company={portal.company_name}
      />
    </div>
  )
}
