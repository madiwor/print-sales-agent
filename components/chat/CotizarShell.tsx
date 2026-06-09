'use client'

import { useState } from 'react'
import { LeadForm } from './LeadForm'
import { ChatWindow } from './ChatWindow'

interface CotizarShellProps {
  slug:       string
  agentName:  string
  company:    string
  greeting:   string
  accentColor?: string
  logo?: React.ReactNode
}

export function CotizarShell({ slug, agentName, company, greeting, accentColor, logo }: CotizarShellProps) {
  const [lead, setLead] = useState<{ name: string; email: string; company?: string } | null>(null)

  if (!lead) {
    return (
      <LeadForm
        onSubmit={({ name, email, company }) => setLead({ name, email, company })}
        accentColor={accentColor}
        logo={logo}
      />
    )
  }

  return (
    <ChatWindow
      slug={slug}
      agentName={agentName}
      company={company}
      greeting={`Hola ${lead.name}, ${greeting.replace(/^Hola,?\s*/, '')}`}
      lead={lead}
      accentColor={accentColor}
    />
  )
}
