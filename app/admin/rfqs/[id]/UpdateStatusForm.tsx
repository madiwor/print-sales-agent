'use client'

import { useState } from 'react'

const OPTIONS = [
  { value: 'submitted',   label: 'Recibida' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'quoted',      label: 'Cotizada' },
  { value: 'closed',      label: 'Cerrada' },
]

export function UpdateStatusForm({ rfqId, currentStatus }: { rfqId: string; currentStatus: string }) {
  const [status, setStatus]   = useState(currentStatus)
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/admin/rfqs/${rfqId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={status}
        onChange={e => { setStatus(e.target.value); setSaved(false) }}
        className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white"
      >
        {OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button
        onClick={handleSave}
        disabled={saving || status === currentStatus}
        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-40"
      >
        {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar'}
      </button>
    </div>
  )
}
