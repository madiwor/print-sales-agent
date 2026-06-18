'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/find-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!res.ok) {
      setError('No encontramos un portal asociado a ese email.')
      setLoading(false)
      return
    }

    const { slug } = await res.json()
    router.push(`/portal/${slug}/admin/login?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block font-bold text-xl tracking-tight text-neutral-900">
            madiwor<span className="text-blue-600">/agents</span>
          </Link>
          <p className="mt-2 text-sm text-neutral-500">Accedé al panel de administración</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-8">
          <h1 className="text-lg font-semibold text-neutral-900 mb-6">Ingresar al panel</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null) }}
                placeholder="tu@empresa.com"
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Buscando…' : 'Continuar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          ¿Necesitás ayuda?{' '}
          <a href="mailto:hola@madiwor.com" className="text-blue-600 hover:underline">
            Contactanos
          </a>
        </p>
      </div>
    </div>
  )
}
