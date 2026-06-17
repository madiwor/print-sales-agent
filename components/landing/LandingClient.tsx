'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ContactModal } from './ContactModal'

const STEPS = [
  {
    n: '1',
    title: 'Tu cliente describe lo que necesita',
    text: 'En lenguaje natural, como le escribiría a un vendedor: "Necesito 10 mil etiquetas de 50×80 en BOPP blanco".',
  },
  {
    n: '2',
    title: 'El agente completa la solicitud',
    text: 'Pregunta solo lo que falta, una cosa por vez. Entiende materiales, medidas, cantidades y requerimientos especiales.',
  },
  {
    n: '3',
    title: 'Tu equipo recibe la cotización lista',
    text: 'Llega por email una solicitud completa y estructurada: producto, medidas, material, cantidad, colores y contacto.',
  },
]

const FEATURES = [
  {
    title: 'Atención 24/7',
    text: 'Tus clientes cotizan a cualquier hora, desde cualquier dispositivo. Ninguna consulta queda sin responder.',
  },
  {
    title: 'Con tu marca',
    text: 'El portal lleva tu logo, tus colores y tu nombre. Tus clientes hablan con tu empresa, no con un software.',
  },
  {
    title: 'Conoce tu negocio',
    text: 'El agente se configura con tus productos, materiales y capacidades. Asesora como lo haría tu mejor vendedor.',
  },
  {
    title: 'Solicitudes completas',
    text: 'Se acabaron los mails de ida y vuelta pidiendo medidas o cantidades. Cada solicitud llega lista para cotizar.',
  },
  {
    title: 'Integración simple',
    text: 'Un link o un iframe en tu web actual. Sin desarrollo, sin cambiar tu sitio, funcionando en el día.',
  },
  {
    title: 'Hecho para la industria gráfica',
    text: 'Etiquetas, packaging, imprenta. El agente habla el idioma del rubro: troqueles, sustratos, acabados, ribbons.',
  },
]

export function LandingClient() {
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <div className="bg-white text-neutral-900">
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

      {/* Nav */}
      <header className="border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">
            madiwor<span className="text-blue-600">/agents</span>
          </span>
          <div className="flex items-center gap-5">
          <Link
            href="/admin/login"
            className="text-sm font-medium text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Acceder al panel
          </Link>
          <button
            onClick={() => setContactOpen(true)}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Contacto
          </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight max-w-3xl mx-auto">
          Tu vendedor digital que captura cotizaciones <span className="text-blue-600">24/7</span>
        </h1>
        <p className="mt-6 text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
          Un agente de IA con tu marca que conversa con tus clientes, entiende qué necesitan
          y le entrega a tu equipo comercial solicitudes de cotización completas y listas para responder.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/demo/cotizar"
            className="rounded-xl bg-blue-600 text-white px-6 py-3 text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Probar la demo en vivo
          </Link>
          <button
            onClick={() => setContactOpen(true)}
            className="rounded-xl border border-neutral-300 px-6 py-3 text-sm font-semibold hover:bg-neutral-50 transition-colors"
          >
            Quiero el mío
          </button>
        </div>
        <p className="mt-4 text-xs text-neutral-400">
          La demo es un portal real: chateá como si fueras un cliente.
        </p>
      </section>

      {/* Cómo funciona */}
      <section className="bg-neutral-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">Cómo funciona</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map(step => (
              <div key={step.n} className="text-center sm:text-left">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto sm:mx-0 mb-4">
                  {step.n}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">
            Pensado para fábricas de etiquetas, imprentas y packaging
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl border border-neutral-200 p-6">
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* En producción */}
      <section className="bg-neutral-50 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Ya está funcionando</h2>
          <p className="text-neutral-600 leading-relaxed">
            Empresas de la industria gráfica ya reciben solicitudes de cotización
            a través de su agente, integrado en su propio sitio web.
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Sumá tu vendedor digital</h2>
          <p className="text-neutral-600 mb-8">
            Contanos sobre tu empresa y en pocos días tu agente está atendiendo clientes con tu marca.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setContactOpen(true)}
              className="rounded-xl bg-blue-600 text-white px-8 py-3 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Contactanos
            </button>
            <Link
              href="/demo/cotizar"
              className="rounded-xl border border-neutral-300 px-8 py-3 text-sm font-semibold hover:bg-neutral-50 transition-colors"
            >
              Ver la demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-neutral-400">
          <span>© {new Date().getFullYear()} Madiwor</span>
          <button
            onClick={() => setContactOpen(true)}
            className="hover:text-neutral-600 transition-colors"
          >
            Contactanos
          </button>
        </div>
      </footer>
    </div>
  )
}
