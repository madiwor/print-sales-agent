'use client'

import { useEffect, useRef } from 'react'
import { useForm, ValidationError } from '@formspree/react'

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, handleSubmit] = useForm('mqeojyqq')
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open) el.showModal()
    else el.close()
  }, [open])

  const fieldClass = 'w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const errorClass = 'text-xs text-red-600 mt-1'

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-full max-w-lg rounded-2xl p-0 shadow-2xl backdrop:bg-black/40 border-0"
    >
      <div className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Contactanos</h2>
            <p className="text-sm text-neutral-500 mt-1">Te respondemos en menos de 24 horas hábiles.</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors ml-4"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {state.succeeded ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-neutral-900 mb-1">Mensaje enviado</p>
            <p className="text-sm text-neutral-500">Nos pondremos en contacto a la brevedad.</p>
            <button
              onClick={onClose}
              className="mt-6 rounded-xl bg-blue-600 text-white px-6 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="fs-name" className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Nombre</label>
              <input id="fs-name" name="name" required className={fieldClass} placeholder="Tu nombre" />
              <ValidationError field="name" errors={state.errors} className={errorClass} />
            </div>

            <div>
              <label htmlFor="fs-email" className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Email</label>
              <input id="fs-email" name="email" type="email" required className={fieldClass} placeholder="tu@empresa.com" />
              <ValidationError field="email" errors={state.errors} className={errorClass} />
            </div>

            <div>
              <label htmlFor="fs-company" className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Empresa</label>
              <input id="fs-company" name="company" className={fieldClass} placeholder="Nombre de tu empresa" />
            </div>

            <div>
              <label htmlFor="fs-message" className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Mensaje</label>
              <textarea id="fs-message" name="message" rows={4} required className={fieldClass} placeholder="Contanos sobre tu negocio y qué estás buscando…" />
              <ValidationError field="message" errors={state.errors} className={errorClass} />
            </div>

            <ValidationError errors={state.errors} className={errorClass} />

            <button
              type="submit"
              disabled={state.submitting}
              className="rounded-xl bg-blue-600 text-white px-6 py-3 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2"
            >
              {state.submitting ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </form>
        )}
      </div>
    </dialog>
  )
}
