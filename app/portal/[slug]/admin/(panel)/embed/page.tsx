import { EmbedWidgets } from './_components/EmbedWidgets'

export const dynamic = 'force-dynamic'

export default async function PortalEmbedPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  const chatUrl = `${base}/${slug}/cotizar`

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Integrar en tu web</h1>
      <p className="text-sm text-gray-500 mb-8">
        Usá el snippet de abajo para agregar el agente cotizador a cualquier página de tu sitio.
      </p>
      <EmbedWidgets chatUrl={chatUrl} slug={slug} />
    </div>
  )
}
