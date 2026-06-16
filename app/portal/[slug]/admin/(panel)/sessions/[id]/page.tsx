import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPortalUser } from '@/lib/supabase/portal-auth'
import { getPortalSession } from '@/lib/supabase/portal-admin'

export const dynamic = 'force-dynamic'

export default async function PortalSessionDetail({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const user = await getPortalUser()
  if (!user || user.converter_slug !== slug) notFound()

  const result = await getPortalSession(slug, id)
  if (!result) notFound()
  const { session, messages } = result

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">{session.contact_email}</h1>
      <p className="text-sm text-gray-500 mb-2">
        {new Date(session.created_at).toLocaleString('es-AR')} · {session.turn_count} mensajes
      </p>
      {session.rfq_id && (
        <Link href={`/portal/${slug}/admin/rfqs/${session.rfq_id}`} className="inline-block mb-6 text-sm text-blue-600 hover:underline">
          Ver RFQ generada →
        </Link>
      )}

      <div className="flex flex-col gap-3">
        {messages.map((m: any, i: number) => {
          const isUser = m.role === 'user'
          const text = typeof m.content === 'string'
            ? m.content
            : Array.isArray(m.content)
              ? m.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
              : ''
          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                isUser
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
              }`}>
                {text || <span className="opacity-40 italic">vacío</span>}
              </div>
            </div>
          )
        })}
        {messages.length === 0 && <p className="text-gray-400">Sin mensajes.</p>}
      </div>
    </div>
  )
}
