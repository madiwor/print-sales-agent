'use client'

import { useState, type FormEvent } from 'react'

interface LeadFormProps {
  onSubmit: (lead: { name: string; email: string; turnstileToken?: string }) => void
  accentColor?: string
  logo?: React.ReactNode
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export function LeadForm({ onSubmit, accentColor = '#E31E24', logo }: LeadFormProps) {
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]    = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setError('')
    setLoading(true)
    try {
      onSubmit({ name: name.trim(), email: email.trim() })
    } catch {
      setError('Hubo un error. Por favor intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-10">
      {logo && <div className="mb-8">{logo}</div>}

      <div className="w-full max-w-sm">
        <h2 className="text-xl font-semibold text-neutral-900 mb-1 text-center">
          Solicitá tu cotización
        </h2>
        <p className="text-sm text-neutral-500 text-center mb-6">
          Contanos qué necesitás y te respondemos a la brevedad.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="lead-name" className="block text-sm font-medium text-neutral-700 mb-1">
              Nombre
            </label>
            <input
              id="lead-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              required
              autoFocus
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
            />
          </div>

          <div>
            <label htmlFor="lead-email" className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              id="lead-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              required
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim()}
            className="w-full rounded-xl text-white px-4 py-2.5 text-sm font-semibold
              disabled:opacity-40 disabled:cursor-not-allowed transition-opacity mt-1"
            style={{ backgroundColor: accentColor }}
          >
            {loading ? 'Iniciando...' : 'Comenzar'}
          </button>
        </form>
      </div>
    </div>
  )
}
