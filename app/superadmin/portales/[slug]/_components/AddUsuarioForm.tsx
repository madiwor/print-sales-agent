'use client'

import { useState } from 'react'

export function AddUsuarioForm({ slug }: { slug: string }) {
  const [email,   setEmail]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError(null)

    const res = await fetch(`/api/superadmin/portales/${slug}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setSuccess(true)
      setEmail('')
    } else {
      const { error: msg } = await res.json().catch(() => ({ error: 'Error desconocido' }))
      setError(msg ?? 'Error al crear usuario')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">Agregar usuario admin</h2>
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => { setEmail(e.target.value); setSuccess(false); setError(null) }}
            placeholder="usuario@empresa.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 shrink-0"
        >
          {saving ? 'Creando…' : 'Invitar'}
        </button>
      </form>
      {success && (
        <p className="mt-3 text-sm text-green-600">
          ✓ Usuario creado. Recibirá un email para activar su cuenta.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}
