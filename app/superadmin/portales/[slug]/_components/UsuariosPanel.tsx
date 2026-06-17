'use client'

import { useState, useEffect, useCallback } from 'react'

interface PortalUser {
  id:         string
  email:      string
  created_at: string
  confirmed:  boolean
}

export function UsuariosPanel({ slug }: { slug: string }) {
  const [users,   setUsers]   = useState<PortalUser[]>([])
  const [loading, setLoading] = useState(true)
  const [email,   setEmail]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/superadmin/api/portales/${slug}/usuarios`)
    if (res.ok) {
      const { users: data } = await res.json()
      setUsers(data ?? [])
    }
    setLoading(false)
  }, [slug])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const res = await fetch(`/superadmin/api/portales/${slug}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setSuccess(true)
      setEmail('')
      fetchUsers()
      setTimeout(() => setSuccess(false), 3000)
    } else {
      const { error: msg } = await res.json().catch(() => ({ error: 'Error desconocido' }))
      setError(msg ?? 'Error al invitar usuario')
    }
    setSaving(false)
  }

  async function handleDelete(userId: string) {
    if (!confirm('¿Eliminar este usuario del portal?')) return
    setDeleting(userId)
    const res = await fetch(`/superadmin/api/portales/${slug}/usuarios`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) fetchUsers()
    setDeleting(null)
  }

  const input = 'border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">Usuarios administradores</h2>

      {/* User list */}
      {loading ? (
        <p className="text-xs text-gray-400 mb-4">Cargando…</p>
      ) : users.length === 0 ? (
        <p className="text-xs text-gray-400 mb-4">Sin usuarios aún.</p>
      ) : (
        <ul className="divide-y divide-gray-100 mb-4 border border-gray-100 rounded-lg overflow-hidden">
          {users.map(u => (
            <li key={u.id} className="flex items-center justify-between px-3 py-2">
              <div>
                <span className="text-sm text-gray-900">{u.email}</span>
                {!u.confirmed && (
                  <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                    Pendiente
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(u.id)}
                disabled={deleting === u.id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
              >
                {deleting === u.id ? '…' : 'Eliminar'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Invite form */}
      <form onSubmit={handleInvite} className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Invitar por email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => { setEmail(e.target.value); setSuccess(false); setError(null) }}
            placeholder="usuario@empresa.com"
            className={`w-full ${input}`}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 shrink-0"
        >
          {saving ? 'Enviando…' : 'Invitar'}
        </button>
      </form>
      {success && <p className="mt-2 text-sm text-green-600">✓ Invitación enviada.</p>}
      {error   && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
