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
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
    >
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>
      Cerrar sesión
    </button>
  )
}
