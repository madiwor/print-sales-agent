'use client'

import { useState } from 'react'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 text-gray-600 transition-colors"
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <CopyButton text={code} />
      </div>
      <pre className="bg-gray-950 text-gray-100 text-xs rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
        {code}
      </pre>
    </div>
  )
}

export function EmbedWidgets({ chatUrl, slug }: { chatUrl: string; slug: string }) {
  const iframeSnippet = `<iframe
  src="${chatUrl}"
  width="400"
  height="680"
  style="border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);"
  allow="clipboard-write"
  title="Cotizador ${slug}"
></iframe>`

  return (
    <div>
      <CodeBlock label="URL directa del agente" code={chatUrl} />
      <CodeBlock label="Snippet iframe para tu web" code={iframeSnippet} />

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Cómo usarlo</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Pegá el <strong>snippet iframe</strong> en cualquier página HTML de tu sitio.</li>
          <li>Podés ajustar <code className="bg-blue-100 px-1 rounded">width</code> y <code className="bg-blue-100 px-1 rounded">height</code> según tu diseño.</li>
          <li>La <strong>URL directa</strong> sirve para compartir el agente por WhatsApp o email.</li>
        </ul>
      </div>
    </div>
  )
}
