'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AcceptInvitePage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function processInvite() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      // Supabase puts the tokens in the URL hash after redirect
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const accessToken  = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (!accessToken || !refreshToken) {
        setErrorMsg('Link inválido o expirado. Pedile al administrador que te reenvíe la invitación.')
        setStatus('error')
        return
      }

      const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })

      if (error || !data.user) {
        setErrorMsg('No se pudo activar la sesión. El link puede haber expirado.')
        setStatus('error')
        return
      }

      const converterSlug = data.user.user_metadata?.converter_slug as string | undefined

      if (!converterSlug) {
        setErrorMsg('No se encontró el portal asociado a tu cuenta. Contactá a soporte.')
        setStatus('error')
        return
      }

      router.replace(`/portal/${converterSlug}/admin`)
    }

    processInvite()
  }, [router])

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-neutral-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="font-semibold text-neutral-900 mb-2">No se pudo activar la cuenta</p>
          <p className="text-sm text-neutral-500">{errorMsg}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-neutral-500">Activando tu cuenta…</p>
      </div>
    </div>
  )
}
