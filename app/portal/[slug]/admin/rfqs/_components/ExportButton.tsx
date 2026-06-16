'use client'

export function ExportButton({ slug, status }: { slug: string; status?: string }) {
  function handleExport() {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    window.location.href = `/api/portal/${slug}/admin/rfqs/export?${params}`
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
      </svg>
      Exportar CSV
    </button>
  )
}
