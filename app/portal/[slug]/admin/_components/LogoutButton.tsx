'use client'

import { useParams } from 'next/navigation'

export function LogoutButton() {
  const { slug } = useParams() as { slug: string }

  async function handleLogout() {
    await fetch(`/api/portal/${slug}/admin/auth/logout`, { method: 'POST' })
    window.location.href = `/portal/${slug}/admin/login`
  }

  return (
    <button
      onClick={handleLogout}
      className="mt-auto mx-3 mb-4 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 text-left rounded-md hover:bg-gray-50 transition-colors"
    >
      Cerrar sesión
    </button>
  )
}
